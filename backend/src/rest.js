// Generic data endpoint used by the React screens: POST /api/rest/:table
// Translates a small JSON query (select / filters / order / insert / update / delete)
// into safe, parameterised MySQL. Tables and columns are checked against the schema.
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool, tx, nextNumber } from "./db.js";
import { log } from "./log.js";
import { registerDocuments } from "./documents.js";
import { z } from "zod";
import { DELETABLE_MASTERS, deleteMaster } from "./master-deletion.js";

const r = Router();

// Tables the screens may use, and who may write to them
const READ = new Set(["suppliers", "departments", "fbr_hs_codes", "custom_hs_codes", "purchases", "purchase_items",
  "quotations", "quotation_items", "quotation_approvals", "invoices", "invoice_items", "stock_movements", "current_stock",
  "type_of_goods", "units_of_measurement", "sro_master", "buyer_types", "system_settings", "activity_logs", "roles", "permissions", "role_permissions", "user_roles", "profiles", "document_counters"]);
const WRITE_STAFF = new Set(["suppliers", "departments", "fbr_hs_codes", "custom_hs_codes", "purchases", "purchase_items",
  "quotations", "quotation_items", "invoices", "invoice_items"]);
const INSERT_ONLY = new Set(["stock_movements"]);
const WRITE_ADMIN = new Set(["type_of_goods", "units_of_measurement", "sro_master", "buyer_types", "system_settings", "roles", "role_permissions", "user_roles", "profiles"]);
const LOGGED = new Set(["type_of_goods", "units_of_measurement", "sro_master", "buyer_types", "suppliers", "departments", "fbr_hs_codes", "custom_hs_codes", "purchases", "quotations", "invoices", "system_settings", "user_roles"]);
const PK = { system_settings: "key", role_permissions: "role_id", document_counters: "prefix" };

let colCache = null;
async function columns() {
  if (colCache) return colCache;
  const [rows] = await pool.query("SELECT TABLE_NAME t, COLUMN_NAME c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE()");
  colCache = {};
  for (const { t, c } of rows) (colCache[t] ??= new Set()).add(c);
  return colCache;
}
const q = (id) => "`" + String(id).replace(/`/g, "") + "`";
const singular = (t) => t.replace(/ies$/, "y").replace(/s$/, "");

function bad(msg, status = 400) { const e = new Error(msg); e.status = status; return e; }

async function checkCol(table, col) {
  const cols = await columns();
  if (!cols[table]?.has(col)) throw bad(`Unknown column ${col} on ${table}`);
  return q(col);
}

// Parse "a, b, rel(x, y), rel2(*)" at top level
function parseSelect(s = "*") {
  const out = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((p) => {
    const m = p.match(/^([a-z_]+)\((.*)\)$/s);
    return m ? { embed: m[1], inner: m[2] } : { col: p };
  });
}

async function whereSql(table, filters) {
  const parts = [], args = [];
  for (const f of filters || []) {
    if (f.op === "or") {
      const ors = [];
      for (const piece of String(f.val).split(",")) {
        const [col, op, ...rest] = piece.split(".");
        const val = rest.join(".");
        const c = await checkCol(table, col);
        if (op === "ilike") { ors.push(`${c} LIKE ?`); args.push(val.replace(/\*/g, "%")); }
        else if (op === "eq") { ors.push(`${c} = ?`); args.push(val); }
        else throw bad("Unsupported filter");
      }
      if (ors.length) parts.push(`(${ors.join(" OR ")})`);
      continue;
    }
    const c = await checkCol(table, f.col);
    const ops = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" };
    if (ops[f.op]) { parts.push(`${c} ${ops[f.op]} ?`); args.push(f.val); }
    else if (f.op === "ilike") { parts.push(`${c} LIKE ?`); args.push(f.val); }
    else if (f.op === "in") { if (!f.val?.length) parts.push("1=0"); else { parts.push(`${c} IN (?)`); args.push(f.val); } }
    else if (f.op === "is") parts.push(f.val === null ? `${c} IS NULL` : `${c} IS NOT NULL`);
    else throw bad("Unsupported filter");
  }
  return { sql: parts.length ? " WHERE " + parts.join(" AND ") : "", args };
}

async function attachEmbeds(conn, table, rows, embeds) {
  const cols = await columns();
  for (const { embed, inner } of embeds) {
    if (!READ.has(embed)) throw bad(`Unknown relation ${embed}`);
    const innerCols = parseSelect(inner).filter((x) => x.col).map((x) => x.col);
    const sel = innerCols.includes("*") ? "*" : (await Promise.all(innerCols.map((c) => checkCol(embed, c)))).join(",");
    const fk = `${singular(embed)}_id`;
    if (cols[table]?.has(fk)) {
      // many-to-one: rows.<fk> -> embed.id
      const ids = [...new Set(rows.map((x) => x[fk]).filter(Boolean))];
      const [found] = ids.length ? await conn.query(`SELECT *, id AS __id FROM ${q(embed)} WHERE id IN (?)`, [ids]) : [[]];
      const map = new Map(found.map((f) => [f.__id, f]));
      for (const row of rows) {
        const f = map.get(row[fk]);
        row[embed] = f ? pick(f, sel === "*" ? null : innerCols) : null;
      }
    } else {
      const back = `${singular(table)}_id`;
      if (!cols[embed]?.has(back)) throw bad(`No relation between ${table} and ${embed}`);
      const ids = rows.map((x) => x.id);
      const [found] = ids.length ? await conn.query(`SELECT * FROM ${q(embed)} WHERE ${q(back)} IN (?) ORDER BY ${cols[embed]?.has("line_position")?"line_position,created_at":"created_at"}`, [ids]).catch(() => conn.query(`SELECT * FROM ${q(embed)} WHERE ${q(back)} IN (?)`, [ids])) : [[]];
      for (const row of rows) row[embed] = found.filter((f) => f[back] === row.id).map((f) => pick(f, sel === "*" ? null : innerCols));
    }
  }
}
function pick(o, keys) {
  const c = { ...o }; delete c.__id;
  if (!keys) return c;
  return Object.fromEntries(keys.map((k) => [k, c[k]]));
}

async function doSelect(conn, table, b) {
  const parts = parseSelect(b.select || "*");
  const plain = parts.filter((p) => p.col).map((p) => p.col);
  const embeds = parts.filter((p) => p.embed);
  const cols = await columns();
  let sel = plain.includes("*") || !plain.length ? "*" : (await Promise.all(plain.map((c) => checkCol(table, c)))).join(",");
  // keep keys needed to join embeds
  if (sel !== "*") for (const { embed } of embeds) {
    const fk = `${singular(embed)}_id`;
    if (cols[table]?.has(fk) && !plain.includes(fk)) sel += "," + q(fk);
    if (!plain.includes("id") && cols[table]?.has("id")) sel += ",`id`";
  }
  const filters = [...(b.filters || [])];
  if (DELETABLE_MASTERS.has(table) && !b.include_deleted && (await columns())[table]?.has('deleted_at')) filters.push({ op: 'is', col: 'deleted_at', val: null });
  const w = await whereSql(table, filters);
  let count = null;
  if (b.count) count = (await conn.query(`SELECT COUNT(*) n FROM ${q(table)}${w.sql}`, w.args))[0][0].n;
  if (b.head) return { data: null, count };
  let sql = `SELECT ${sel} FROM ${q(table)}${w.sql}`;
  if (b.order?.length) sql += " ORDER BY " + (await Promise.all(b.order.map(async (o) => `${await checkCol(table, o.col)} ${o.asc ? "ASC" : "DESC"}`))).join(",");
  if (b.limit) sql += ` LIMIT ${Number(b.limit) | 0}` + (b.offset ? ` OFFSET ${Number(b.offset) | 0}` : "");
  const [rows] = await conn.query(sql, w.args);
  if (embeds.length && rows.length) await attachEmbeds(conn, table, rows, embeds);
  return shape(rows, b, count);
}
function shape(rows, b, count) {
  if (b.single) { if (rows.length !== 1) throw bad(rows.length ? "More than one row found" : "Record not found", 404); return { data: rows[0], count }; }
  if (b.maybe) return { data: rows[0] ?? null, count };
  return { data: rows, count };
}

async function clean(table, obj, user, isInsert) {
  const cols = (await columns())[table];
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (!cols.has(k)) continue;
    out[k] = v !== null && typeof v === "object" ? JSON.stringify(v) : v;
  }
  if (table === "custom_hs_codes" && Object.hasOwn(out, "type_of_goods")) {
    if (!out.type_of_goods || out.type_of_goods === "No suggestion") out.type_of_goods = null;
    else {
      const [[type]] = await pool.query("SELECT id FROM type_of_goods WHERE name=? AND status='active' AND deleted_at IS NULL", [out.type_of_goods]);
      if (!type) throw bad("Select an active Type of Goods for this HS code");
    }
  }
  if (isInsert) {
    if (["type_of_goods","units_of_measurement","sro_master","buyer_types"].includes(table)) delete out.serial_number;
    if (cols.has("id") && !out.id) out.id = randomUUID();
    if (cols.has("created_by") && !out.created_by) out.created_by = user.id;
  }
  delete out.sales_tax_value;
  delete out.updated_at; delete out.created_at;
  return out;
}

r.post("/rest/:table", async (req, res, next) => {
  try {
    const table = req.params.table;
    const b = req.body || {};
    const user = req.user;
    const isAdmin = user.roles.includes("super_admin") || user.roles.includes("admin");
    if (!READ.has(table)) throw bad("Unknown table", 404);
    const master = ["type_of_goods","units_of_measurement","sro_master","buyer_types"].includes(table);
    if(master && !user.roles.includes("super_admin") && !user.permissions.includes(`${table}:${b.op === "select" ? "view" : b.op === "insert" ? "create" : b.op === "delete" ? "delete" : b.values?.verification ? "verify" : "edit"}`)) throw bad("Permission required",403);
    const docModule = ["purchases","quotations","invoices"].includes(table);
    if(docModule && b.op!=="select"){
      if(["insert","upsert"].includes(b.op))throw bad("Use transactional document creation",403);
      const action=b.op==="delete"?"delete":b.values?.verification?"verify":b.values?.status==="approved"?"approve":"edit";
      if(!user.roles.includes("super_admin")&&!user.permissions.includes(`${table}:${action}`))throw bad("Permission required",403);
      if(b.op==="update"){
        const allowedFields=table==="quotations"?["status","approval_remarks","approved_at","verification"]:["verification"];
        if(Object.keys(b.values||{}).some(k=>!allowedFields.includes(k)))throw bad("Use transactional document editing",403);
        if(b.values?.verification)z.enum(["draft","unverified","verified"]).parse(b.values.verification);
        if(b.values?.status)z.enum(["draft","submitted","approved","rejected","cancelled"]).parse(b.values.status);
      }
    }
    if (b.op === "select") return res.json(await doSelect(pool, table, b));
    if (["purchase_items","invoice_items","quotation_items"].includes(table)) throw bad("Use transactional document creation/editing",403);
    if(master && ["insert","update","upsert"].includes(b.op)) {
      const schema=z.object({name:z.string().trim().min(1).max(200).optional(),status:z.enum(["active","inactive"]).optional(),verification:z.enum(["draft","unverified","verified"]).optional()});
      const values=Array.isArray(b.values)?b.values:[b.values];
      for(const v of values){const parsed=schema.parse(v);if(b.op!=="update"&&!parsed.name)throw bad("Name is required");delete v.serial_number;}
    }

    const allowed = WRITE_STAFF.has(table) || (INSERT_ONLY.has(table) && b.op === "insert") || (WRITE_ADMIN.has(table) && isAdmin);
    if (!allowed && !master) throw bad("You do not have permission for this action", 403);
    const pk = PK[table] || "id";

    const result = await tx(async (c) => {
      if (b.op === "insert" || b.op === "upsert") {
        const list = Array.isArray(b.values) ? b.values : [b.values];
        const keys = [];
        for (const v of list) {
          const row = await clean(table, v, user, true);
          if (b.op === "upsert") {
            const upd = Object.keys(row).filter((k) => k !== pk).map((k) => `${q(k)}=VALUES(${q(k)})`).join(",");
            await c.query(`INSERT INTO ${q(table)} SET ? ON DUPLICATE KEY UPDATE ${upd || q(pk) + "=" + q(pk)}`, [row]);
          } else await c.query(`INSERT INTO ${q(table)} SET ?`, [row]);
          keys.push(row[pk]);
          if (LOGGED.has(table)) await log(c, user, "insert", table, row[pk], label(row), null, row);
        }
        if (b.select === undefined) return { data: null };
        const [rows] = await c.query(`SELECT * FROM ${q(table)} WHERE ${q(pk)} IN (?)`, [keys]);
        return shape(rows, b, null);
      }
      const w = await whereSql(table, b.filters);
      if (!w.sql) throw bad("A filter is required");
      const [before] = await c.query(`SELECT * FROM ${q(table)}${w.sql} FOR UPDATE`, w.args);
      if (b.op === "update") {
        const row = await clean(table, b.values, user, false);
        if (Object.keys(row).length) await c.query(`UPDATE ${q(table)} SET ?${w.sql}`, [row, ...w.args]);
        for (const old of before) {
          const [[now]] = await c.query(`SELECT * FROM ${q(table)} WHERE ${q(pk)}=?`, [old[pk]]);
          await afterUpdate(c, table, old, now, user);
          if (LOGGED.has(table)) await log(c, user, "update", table, old[pk], label(now), old, now);
        }
        if (b.select === undefined) return { data: null };
        const [rows] = await c.query(`SELECT * FROM ${q(table)} WHERE ${q(pk)} IN (?)`, [before.map((x) => x[pk]).concat("__none")]);
        return shape(rows, b, null);
      }
      if (b.op === "delete") {
        if (DELETABLE_MASTERS.has(table)) {
          if (!(await columns())[table]?.has('deleted_at')) throw bad('Apply database/upgrade-v19.sql before deleting master records.', 409);
          await deleteMaster(c, table, w.sql, w.args);
          if (LOGGED.has(table)) for (const old of before) await log(c, user, 'delete', table, old[pk], label(old), old, { ...old, deleted_at: new Date() });
          return { data: null };
        }
        await c.query(`DELETE FROM ${q(table)}${w.sql}`, w.args); // verified rows are blocked by DB triggers
        if (table === "invoices") for (const old of before) await c.query("DELETE FROM stock_movements WHERE reference_type='invoice' AND reference_id=?", [old.id]);
        if (LOGGED.has(table)) for (const old of before) await log(c, user, "delete", table, old[pk], label(old), old, null);
        return { data: null };
      }
      throw bad("Unsupported operation");
    });
    res.json(result);
  } catch (e) { next(e); }
});

const label = (x) => x.purchase_number || x.quotation_number || x.invoice_number || x.name || x.hs_code || x.key || x.id;

// Official FBR code for a custom (or FBR) code; null when no valid mapping exists
async function resolveFbr(c, code) {
  const [[m]] = await c.query("SELECT f.hs_code FROM custom_hs_codes cu JOIN fbr_hs_codes f ON CONVERT(f.hs_code USING utf8mb4) COLLATE utf8mb4_unicode_ci = COALESCE(NULLIF(CONVERT(TRIM(cu.fbr_hs_code) USING utf8mb4) COLLATE utf8mb4_unicode_ci,''), CONVERT(cu.hs_code USING utf8mb4) COLLATE utf8mb4_unicode_ci) WHERE cu.hs_code=? LIMIT 1", [code]);
  if (m) return m.hs_code;
  const [[f]] = await c.query("SELECT hs_code FROM fbr_hs_codes WHERE hs_code=? LIMIT 1", [code]);
  return f ? f.hs_code : null;
}

async function stockOutForInvoice(c, inv, user) {
  const [items] = await c.query("SELECT * FROM invoice_items WHERE invoice_id=? AND COALESCE(item_kind,'goods')='goods'", [inv.id]);
  for (const it of items) {
    const avail = await available(c, it.hs_code);
    await c.query("INSERT INTO stock_movements SET ?", [{ id: randomUUID(), movement_number: await nextNumber(c, "SOUT"), direction: "out", hs_code: it.hs_code,
      description: it.description, quantity: it.quantity, uom: it.uom, reference_type: "invoice", reference_id: inv.id, reference_number: inv.invoice_number,
      department_id: inv.department_id, movement_date: inv.invoice_date, created_by: user.id, available_before: avail, shortfall: Math.max(Number(it.quantity) - avail, 0) }]);
  }
}

async function available(c, hs) {
  const [[s]] = await c.query("SELECT COALESCE(available,0) a FROM current_stock WHERE hs_code=?", [hs]);
  return Number(s?.a ?? 0);
}

// Business rules that run after an update (same rules as the database triggers in the hosted version)
async function afterUpdate(c, table, old, now, user) {
  if (table === "invoices" && old.verification !== now.verification) {
    if (now.verification === "verified") {
      const [[has]] = await c.query("SELECT id FROM stock_movements WHERE reference_type='invoice' AND reference_id=? LIMIT 1", [now.id]);
      if (!has) await stockOutForInvoice(c, now, user);
    } else if (old.verification === "verified") {
      await c.query("DELETE FROM stock_movements WHERE reference_type='invoice' AND reference_id=?", [now.id]);
    }
  }
  if (table === "purchases" && old.verification !== now.verification) {
    if (now.verification === "verified") {
      const [items] = await c.query("SELECT * FROM purchase_items WHERE purchase_id=?", [now.id]);
      for (const it of items) {
        await c.query("INSERT INTO stock_movements SET ?", [{ id: randomUUID(), movement_number: await nextNumber(c, "SIN"), direction: "in",
          hs_code: it.hs_code, description: it.description, quantity: it.quantity, uom: it.uom, reference_type: "purchase",
          reference_id: now.id, reference_number: now.purchase_number, supplier_id: now.supplier_id, movement_date: now.purchase_date, created_by: user.id }]);
      }
    } else if (old.verification === "verified") {
      await c.query("DELETE FROM stock_movements WHERE reference_type='purchase' AND reference_id=?", [now.id]);
    }
  }
  if (table === "quotations" && old.status !== now.status) {
    if (["submitted", "approved", "rejected"].includes(now.status)) {
      await c.query("INSERT INTO quotation_approvals SET ?", [{ id: randomUUID(), quotation_id: now.id, action: now.status, remarks: now.approval_remarks, acted_by: user.id }]);
    }
    if (now.status === "approved") {
      if (!user.roles.includes("super_admin") && !user.permissions.includes("quotations:approve")) throw bad("Approval permission required",403);
      if (!String(now.vehicle_type || "").trim() && !String(now.vehicle_number || "").trim()) throw bad("Vehicle type or number is required");
      await c.query("UPDATE quotations SET approved_by=COALESCE(approved_by,?), approved_at=COALESCE(approved_at,NOW()) WHERE id=?", [user.id, now.id]);
      const [[exists]] = await c.query("SELECT id FROM invoices WHERE quotation_id=?", [now.id]);
      if (!exists) {
        const invId = randomUUID(), invNum = await nextNumber(c, "INV");
        const today = new Date().toISOString().slice(0, 10);
        const [[buyer]]=await c.query("SELECT name,tax_number FROM departments WHERE id=?",[now.department_id]);
        await c.query("INSERT INTO invoices SET ?", [{ id: invId, invoice_number: invNum, sales_tax_number: await nextNumber(c, "STI"), fbr_status: "offline", vehicle_type: now.vehicle_type, vehicle_number: now.vehicle_number, buyer_type: now.buyer_type ?? null, labor_percent: now.labor_percent, labor_amount: now.labor_amount, buyer_name:buyer?.name??null,buyer_ntn:buyer?.tax_number??null, source: "quotation", invoice_date: today, department_id: now.department_id, quotation_id: now.id,
          notes: `Auto-created from quotation ${now.quotation_number}`, subtotal: now.subtotal, tax_total: now.tax_total,
          grand_total: now.grand_total, status: "approved", verification: "verified", created_by: user.id }]);
        const [items] = await c.query("SELECT * FROM quotation_items WHERE quotation_id=?", [now.id]);
        for (const it of items) {
          await c.query("INSERT INTO invoice_items SET ?", [{ id: randomUUID(), invoice_id: invId, hs_code: it.hs_code, part_number: it.part_number, description: it.description,
            product_name: it.product_name, type_of_goods: it.type_of_goods, type_of_goods_id: it.type_of_goods_id, uom_id: it.uom_id, description_source: it.description_source, quantity: it.quantity, uom: it.uom, unit_price: it.unit_price, tax_percent: it.tax_percent,
            line_position:it.line_position||0,labor_percent: it.labor_percent, labor_amount: it.labor_amount, item_kind: it.item_kind || 'goods', service_percent: it.service_percent ?? null, sro_schedule_no: it.sro_schedule_no ?? null, sro_item_serial_no: it.sro_item_serial_no ?? null, retail_sales_value: it.retail_sales_value ?? 0, fbr_hs_code: it.fbr_hs_code || await resolveFbr(c, it.hs_code), line_total: it.line_total }]);
          if ((it.item_kind || 'goods') === 'service') continue; // services never move stock
          const avail = await available(c, it.hs_code);
          await c.query("INSERT INTO stock_movements SET ?", [{ id: randomUUID(), movement_number: await nextNumber(c, "SOUT"), direction: "out", hs_code: it.hs_code,
            description: it.description, quantity: it.quantity, uom: it.uom, reference_type: "invoice", reference_id: invId, reference_number: invNum,
            department_id: now.department_id, movement_date: today, created_by: user.id, available_before: avail, shortfall: Math.max(Number(it.quantity) - avail, 0) }]);
        }
        await log(c, user, "insert", "invoices", invId, invNum);
      }
      await c.query("UPDATE quotations SET status='invoiced' WHERE id=?", [now.id]);
    }
  }
}

// Database functions the screens call
r.post("/rpc/next_document_number", async (req, res, next) => {
  try { res.json({ data: await tx((c) => nextNumber(c, String(req.body._prefix || "DOC").slice(0, 10))) }); } catch (e) { next(e); }
});
r.post("/rpc/has_role", async (req, res) => {
  res.json({ data: req.body._user_id === req.user.id && req.user.roles.includes(req.body._role_slug) });
});

registerDocuments(r,{afterUpdate,stockOutForInvoice,resolveFbr});
export default r;
