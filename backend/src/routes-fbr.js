import { Router } from "express";
import { randomUUID as uid } from "node:crypto";
import { z } from "zod";
import { pool, tx } from "./db.js";
import { requireAuth } from "./auth.js";
import { log } from "./log.js";
import { ENVIRONMENTS, SCENARIOS, buildPayload, decryptToken, encryptToken, interpret, payloadHash, precheck } from "./fbr.js";

import { sellerSettingsSchema, sellerFromSettings, sandboxPayload } from "./fbr-sandbox.js";
import { connectionState } from "./fbr-connection.js";

const r = Router();
r.use("/fbr", requireAuth);
const allowed = (u, a) => u.roles.includes("super_admin") || u.permissions.includes(`fbr:${a}`);
const need = (a) => (req, res, next) => (allowed(req.user, a) ? next() : res.status(403).json({ error: "You do not have permission for FBR " + a }));
const Env = z.enum(ENVIRONMENTS);
const bad = (m, s = 400) => Object.assign(new Error(m), { status: s });
const wrap = (fn) => (req, res, next) => fn(req, res).catch((e) => {
  if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") });
  next(e);
});
const TIMEOUT_MS = Number(process.env.FBR_TIMEOUT_MS || 30000);

async function settings(c = pool) {
  const [rows] = await c.query("SELECT `key`,value FROM system_settings WHERE `key` LIKE 'fbr_%' OR `key` IN ('company_name','company_address')");
  return Object.fromEntries(rows.map((x) => [x.key, x.value ?? ""]));
}
async function config(env, c = pool) {
  const [[row]] = await c.query("SELECT * FROM fbr_config WHERE environment=?", [env]);
  if (!row) throw bad("FBR configuration missing — run database/upgrade-v10-fbr.sql", 500);
  if (row.connected === undefined) throw bad("Apply database/upgrade-v11-fbr-connections.sql first", 500);
  return row;
}
async function refList(name) {
  const [rows] = await pool.query("SELECT description FROM fbr_reference WHERE list_name=? ORDER BY description", [name]);
  return rows.map((x) => x.description);
}
async function guardEnv(env) {
  if (!(await config(env)).connected) throw bad("This API is disconnected. Connect it in FBR Settings first.", 409);
  if (env === "production" && (await settings())["fbr_production_approved"] !== "1")
    throw bad("Production is locked until Sandbox testing is approved in FBR Settings.", 409);
}

/** Call FBR. Never throws for HTTP errors; returns { status, body, timedOut, networkError }. */
async function callFbr(url, token, body, method = "POST", environment) {
  if (environment) await guardEnv(environment);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method, signal: ac.signal, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const text = await res.text();
    let parsed = text; try { parsed = JSON.parse(text); } catch { /* keep text */ }
    return { status: res.status, body: parsed };
  } catch (e) {
    if (e.name === "AbortError") return { status: null, body: null, timedOut: true };
    return { status: null, body: null, networkError: String(e.cause?.code || e.message) };
  } finally { clearTimeout(t); }
}
async function record(c, user, env, action, invoiceId, outcome, http, req, resp, error, fbrNo = null) {
  await c.query("INSERT INTO fbr_submissions SET ?", [{ id: uid(), invoice_id: invoiceId, environment: env, action, outcome, http_status: http, fbr_invoice_number: fbrNo,
    request_json: req ? JSON.stringify(req) : null, response_json: resp == null ? null : JSON.stringify(resp), error_message: error, user_id: user.id, user_name: user.full_name }]);
}
async function setState(c, invoiceId, env, patch, user) {
  await c.query("INSERT INTO fbr_invoice_state SET ? ON DUPLICATE KEY UPDATE ?", [{ invoice_id: invoiceId, environment: env, ...patch, updated_by: user.id }, { ...patch, updated_by: user.id }]);
}

/** Load an invoice from the database and build its FBR payload. */
async function load(c, id, env, scenarioOverride) {
  const [[inv]] = await c.query(`SELECT i.*, d.name department_name, d.tax_number, d.address, d.province, d.registration_type, s.status fbr_state, s.scenario_id, s.payload_hash
    FROM invoices i JOIN departments d ON d.id=i.department_id LEFT JOIN fbr_invoice_state s ON s.invoice_id=i.id AND s.environment=? WHERE i.id=?`, [env, id]);
  if (!inv) throw bad("Invoice not found", 404);
  const [items] = await c.query(`SELECT it.*, f.description fbr_description FROM invoice_items it
    LEFT JOIN fbr_hs_codes f ON f.hs_code=it.fbr_hs_code WHERE it.invoice_id=? GROUP BY it.id ORDER BY it.line_position, it.created_at`, [id]);
  const st = await settings(c);
  const scenarioId = env === "sandbox" ? scenarioOverride || inv.scenario_id || st["fbr_default_scenario"] || "SN001" : undefined;
  const payload = buildPayload({ inv, items, environment: env, scenarioId, seller: sellerFromSettings(st) });
  return { inv, items, payload, scenarioId };
}

/* ---------- configuration ---------- */
r.get("/fbr/config", need("view"), wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT environment, connected, post_url, validate_url, token_enc IS NOT NULL has_token, last_test_at, last_test_ok, last_test_message, updated_at FROM fbr_config");
  const st = await settings();
  res.json({ environments: rows.map((x) => ({ ...x, has_token: !!x.has_token })), settings: st, scenarios: Object.fromEntries((await pool.query("SELECT scenario_id, description, sale_type FROM fbr_scenarios ORDER BY scenario_id"))[0].map(x => [x.scenario_id, [x.description, x.sale_type]])),
    provinces: await refList("provinces"), uom: await refList("uom"), can: Object.fromEntries(["view", "validate", "submit", "configure"].map((a) => [a, allowed(req.user, a)])) });
}));

r.put("/fbr/config/:env", need("configure"), wrap(async (req, res) => {
  const env = Env.parse(req.params.env);
  const b = z.object({ post_url: z.string().url().startsWith("https://").max(300), validate_url: z.string().url().startsWith("https://").max(300), token: z.string().trim().max(2000).optional(), clear_token: z.boolean().optional() }).parse(req.body);
  const patch = { post_url: b.post_url, validate_url: b.validate_url, updated_by: req.user.id, connected: 0 };
  if (b.clear_token) Object.assign(patch, { token_enc: null, token_last4: null, last_test_ok: null, last_test_message: null });
  else if (b.token) Object.assign(patch, { token_enc: encryptToken(b.token.replace(/^Bearer\s+/i, "")), token_last4: null, last_test_ok: null, last_test_message: "Token changed — test the connection" });
  await pool.query("UPDATE fbr_config SET ? WHERE environment=?", [patch, env]);
  await log(pool, req.user, "update", "fbr_config", env, env, null, { post_url: b.post_url, validate_url: b.validate_url, token_changed: !!b.token, token_cleared: !!b.clear_token });
  res.json({ ok: true });
}));

r.put("/fbr/settings", need("configure"), wrap(async (req, res) => {
  const b = sellerSettingsSchema.parse(req.body);
  for (const [k, v] of Object.entries(b)) await pool.query("INSERT INTO system_settings(`key`,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [k, v]);
  await log(pool, req.user, "update", "fbr_settings", null, "FBR settings", null, b);
  res.json({ ok: true });
}));

r.post("/fbr/production-approval", wrap(async (req, res) => {
  if (!req.user.roles.includes("super_admin")) throw bad("Only the Super Admin can approve Production", 403);
  const approve = z.object({ approve: z.boolean() }).parse(req.body).approve;
  if (approve) {
    const [[ok]] = await pool.query("SELECT COUNT(*) n FROM fbr_invoice_state WHERE environment='sandbox' AND status='sent'");
    if (!ok.n) throw bad("At least one invoice must be sent successfully to Sandbox before Production can be approved", 409);
  }
  await pool.query("INSERT INTO system_settings(`key`,value) VALUES ('fbr_production_approved',?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [approve ? "1" : "0"]);
  if (!approve) await pool.query("UPDATE fbr_config SET connected=0 WHERE environment='production'");
  await log(pool, req.user, approve ? "approve" : "revoke", "fbr_production", null, "Production access");
  res.json({ ok: true });
}));

/** Connection test: calls FBR's province reference API with the saved token, and caches provinces + UOM. */
r.post("/fbr/test/:env", need("configure"), wrap(async (req, res) => {
  const env = Env.parse(req.params.env);
  const current = await config(env);
  if (env === "production" && (await settings())["fbr_production_approved"] !== "1") throw bad("Approve Sandbox testing before connecting Production", 409);
  if (env === "sandbox" && (await config("production")).connected) throw bad("Disconnect Production before connecting Sandbox.", 409);
  const cfg = current;
  const token = decryptToken(cfg.token_enc);
  if (!token) throw bad("Save a token for this environment first");
  const base = new URL(cfg.validate_url).origin;
  const p = await callFbr(`${base}/pdi/v1/provinces`, token, null, "GET");
  let ok = p.status === 200 && Array.isArray(p.body);
  let msg = ok ? `Connected — FBR returned ${p.body.length} provinces` : p.timedOut ? "No reply from FBR within the time limit" : p.networkError ? `Could not reach FBR (${p.networkError})` : p.status === 401 ? "FBR rejected the token (401 Unauthorized)" : `FBR replied with HTTP ${p.status}`;
  if (ok) {
    await pool.query("DELETE FROM fbr_reference WHERE list_name='provinces'");
    for (const x of p.body) await pool.query("INSERT IGNORE INTO fbr_reference(list_name,code,description) VALUES ('provinces',?,?)", [String(x.stateProvinceCode), String(x.stateProvinceDesc)]);
    const u = await callFbr(`${base}/pdi/v1/uom`, token, null, "GET");
    if (u.status === 200 && Array.isArray(u.body)) {
      await pool.query("DELETE FROM fbr_reference WHERE list_name='uom'");
      for (const x of u.body) await pool.query("INSERT IGNORE INTO fbr_reference(list_name,code,description) VALUES ('uom',?,?)", [String(x.uoM_ID), String(x.description)]);
      msg += ` and ${u.body.length} UOM names`;
    }
  }
  await tx(async (c) => {
    const [rows] = await c.query("SELECT * FROM fbr_config ORDER BY environment FOR UPDATE");
    const state = Object.fromEntries(rows.map((x) => [x.environment, !!x.connected]));
    const latest = rows.find((x) => x.environment === env);
    if (!latest || String(latest.updated_at) !== String(cfg.updated_at)) throw bad("Settings changed during the test. Connect again.", 409);
    const next = connectionState(state, env, ok);
    await c.query("UPDATE fbr_config SET connected=? WHERE environment='sandbox'", [next.sandbox ? 1 : 0]);
    await c.query("UPDATE fbr_config SET connected=? WHERE environment='production'", [next.production ? 1 : 0]);
    if (ok) await c.query("UPDATE system_settings SET value=? WHERE `key`='fbr_active_environment'", [env]);
    await c.query("UPDATE fbr_config SET last_test_at=NOW(), last_test_ok=?, last_test_message=? WHERE environment=?", [ok ? 1 : 0, msg, env]);
  });
  await record(pool, req.user, env, "test", null, ok ? "ok" : "failed", p.status, null, typeof p.body === "string" ? p.body.slice(0, 2000) : Array.isArray(p.body) ? { count: p.body.length } : p.body, ok ? null : msg);
  res.json({ ok, message: msg });
}));

r.post("/fbr/disconnect/:env", need("configure"), wrap(async (req, res) => {
  const env = Env.parse(req.params.env);
  await tx(async (c) => {
    await c.query("SELECT environment FROM fbr_config ORDER BY environment FOR UPDATE");
    await c.query("UPDATE fbr_config SET connected=0, last_test_message='Disconnected', updated_by=? WHERE environment=?", [req.user.id, env]);
    await log(c, req.user, "disconnect", "fbr_config", env, env);
  });
  res.json({ ok: true });
}));


/* Isolated Sandbox test payloads never create invoices or stock movements. */
r.post("/fbr/sandbox/validate", need("validate"), wrap(async (req, res) => {
  const payload = sandboxPayload(req.body, await settings());
  const issues = precheck(payload, { environment: "sandbox", uomList: await refList("uom"), provinceList: await refList("provinces") });
  // Special-sector taxes are entered from PRAL's scenario data, not a standard GST formula.
  const blocking = issues.filter(x => !x.warning);
  if (blocking.length) return res.json({ outcome: "precheck_failed", payload, errors: issues });
  await guardEnv("sandbox");
  const cfg = await config("sandbox"); const token = decryptToken(cfg.token_enc);
  if (!token) throw bad("Save a Sandbox token first");
  const call = await callFbr(cfg.validate_url, token, payload, "POST", "sandbox");
  const result = call.timedOut || call.networkError ? { outcome: "unreachable", errors: [{ where: "Connection", problem: "FBR could not be reached", fix: "Check your connection and try again" }] } : interpret(call.status, call.body);
  await record(pool, req.user, "sandbox", "validate", null, result.outcome, call.status, payload, call.body, result.errors.map(x => x.problem).join("; ") || null);
  res.json({ ...result, payload, errors: [...issues, ...result.errors], response: call.body });
}));

/* ---------- invoice list ---------- */
const STATUS_FILTERS = {
  remaining: "COALESCE(s.status,'not_validated')<>'sent'",
  not_validated: "COALESCE(s.status,'not_validated')='not_validated'",
  validation_failed: "s.status='validation_failed'",
  validated: "s.status='validated'",
  sent: "s.status='sent'",
  failed: "s.status IN ('submission_failed','pending_confirmation','submitting')",
  all: "1=1",
};
r.get("/fbr/invoices", need("view"), wrap(async (req, res) => {
  const q = z.object({ env: Env, department_id: z.string().uuid(), from: z.string().optional(), to: z.string().optional(), status: z.enum(Object.keys(STATUS_FILTERS)).default("remaining"), search: z.string().max(100).optional() }).parse(req.query);
  const where = ["i.department_id=?", STATUS_FILTERS[q.status]]; const args = [q.env, q.department_id];
  if (q.from) { where.push("i.invoice_date>=?"); args.push(q.from); }
  if (q.to) { where.push("i.invoice_date<=?"); args.push(q.to); }
  if (q.search) { where.push("(i.invoice_number LIKE ? OR i.sales_tax_number LIKE ? OR s.fbr_invoice_number LIKE ?)"); const t = `%${q.search}%`; args.push(t, t, t); }
  const [rows] = await pool.query(`SELECT i.id, i.invoice_number, i.sales_tax_number, i.invoice_date, i.grand_total, i.tax_total, d.name department_name, d.tax_number buyer_ntn, d.province buyer_province,
    COALESCE(s.status,'not_validated') fbr_status, s.fbr_invoice_number, s.scenario_id, s.last_errors, s.validated_at, s.submitted_at
    FROM invoices i JOIN departments d ON d.id=i.department_id LEFT JOIN fbr_invoice_state s ON s.invoice_id=i.id AND s.environment=?
    WHERE ${where.join(" AND ")} ORDER BY i.invoice_date DESC, i.invoice_number DESC LIMIT 1000`, args);
  res.json(rows.map((x) => ({ ...x, last_errors: typeof x.last_errors === "string" ? JSON.parse(x.last_errors) : x.last_errors })));
}));

/* ---------- FBR Final Invoices: only invoices FBR accepted in Production (FBR-issued number present) ---------- */
r.get("/fbr/final-invoices", need("view"), wrap(async (req, res) => {
  const q = z.object({ from: z.string().optional(), to: z.string().optional(), search: z.string().max(100).optional(), id: z.string().uuid().optional() }).parse(req.query);
  const where = ["s.environment='production'", "s.status='sent'", "s.fbr_invoice_number IS NOT NULL", "s.fbr_invoice_number<>''"], args = [];
  if (q.id) { where.push("i.id=?"); args.push(q.id); }
  if (q.from) { where.push("i.invoice_date>=?"); args.push(q.from); }
  if (q.to) { where.push("i.invoice_date<=?"); args.push(q.to); }
  if (q.search) { where.push("(i.invoice_number LIKE ? OR i.sales_tax_number LIKE ? OR s.fbr_invoice_number LIKE ? OR d.name LIKE ?)"); const t = `%${q.search}%`; args.push(t, t, t, t); }
  const [rows] = await pool.query(`SELECT i.id, i.invoice_number, i.sales_tax_number, i.invoice_date, i.grand_total, i.tax_total, i.buyer_type, d.name department_name, s.fbr_invoice_number, s.submitted_at
    FROM fbr_invoice_state s JOIN invoices i ON i.id=s.invoice_id JOIN departments d ON d.id=i.department_id WHERE ${where.join(" AND ")} ORDER BY s.submitted_at DESC LIMIT 1000`, args);
  res.json(rows);
}));

r.get("/fbr/preview/:id", need("view"), wrap(async (req, res) => {
  const env = Env.parse(req.query.env);
  const { payload, inv } = await load(pool, z.string().uuid().parse(req.params.id), env, req.query.scenario);
  res.json({ payload, issues: precheck(payload, { environment: env, uomList: await refList("uom"), provinceList: await refList("provinces"), invoice: inv }) });
}));

/* ---------- validate ---------- */
const Batch = z.object({ env: Env, ids: z.array(z.string().uuid()).min(1).max(200), scenario: z.string().optional(), confirm_retry: z.boolean().optional() });
r.post("/fbr/validate", need("validate"), wrap(async (req, res) => {
  const b = Batch.parse(req.body); await guardEnv(b.env);
  if (b.scenario && !SCENARIOS[b.scenario]) throw bad("Unknown scenario");
  const cfg = await config(b.env); const token = decryptToken(cfg.token_enc);
  const uomList = await refList("uom"), provinceList = await refList("provinces");
  const results = [];
  for (const id of b.ids) {
    const { inv, payload, scenarioId } = await load(pool, id, b.env, b.scenario);
    const base = { id, invoice_number: inv.invoice_number };
    if (inv.fbr_state === "sent") { results.push({ ...base, outcome: "already_sent", errors: [] }); continue; }
    const issues = precheck(payload, { environment: b.env, uomList, provinceList, invoice: inv });
    const blocking = issues.filter((x) => !x.warning);
    if (blocking.length) {
      await setState(pool, id, b.env, { status: "validation_failed", scenario_id: scenarioId ?? null, last_errors: JSON.stringify(issues), validated_at: new Date() }, req.user);
      results.push({ ...base, outcome: "precheck_failed", errors: issues }); continue;
    }
    if (!token) { results.push({ ...base, outcome: "no_token", errors: [{ where: "Settings", problem: "No token saved for " + b.env, fix: "Add the token in FBR Invoicing → Settings." }] }); continue; }
    const call = await callFbr(cfg.validate_url, token, payload, "POST", b.env);
    const it = call.timedOut || call.networkError ? { outcome: "unreachable", errors: [{ where: "Connection", problem: call.timedOut ? "FBR did not reply in time." : "Could not reach FBR.", fix: "Check the internet connection and try validating again." }] } : interpret(call.status, call.body);
    const errors = [...issues, ...it.errors];
    if (it.outcome === "valid") await setState(pool, id, b.env, { status: "validated", scenario_id: scenarioId ?? null, payload_hash: payloadHash(payload), last_errors: errors.length ? JSON.stringify(errors) : null, validated_at: new Date() }, req.user);
    else if (it.outcome === "invalid") await setState(pool, id, b.env, { status: "validation_failed", scenario_id: scenarioId ?? null, last_errors: JSON.stringify(errors), validated_at: new Date() }, req.user);
    await record(pool, req.user, b.env, "validate", id, it.outcome, call.status, payload, call.body, it.errors.map((e) => e.fbr_message || e.problem).join("; ") || null);
    results.push({ ...base, outcome: it.outcome, errors });
  }
  res.json({ results });
}));

/* ---------- submit ---------- */
r.post("/fbr/submit", need("submit"), wrap(async (req, res) => {
  const b = Batch.parse(req.body); await guardEnv(b.env);
  const cfg = await config(b.env); const token = decryptToken(cfg.token_enc);
  if (!token) throw bad("No token saved for " + b.env);
  const results = [];
  for (const id of b.ids) {
    // Claim the invoice inside a transaction so two users can never send it twice.
    const claim = await tx(async (c) => {
      await c.query("INSERT IGNORE INTO fbr_invoice_state(invoice_id, environment) VALUES (?,?)", [id, b.env]);
      const [[s]] = await c.query("SELECT * FROM fbr_invoice_state WHERE invoice_id=? AND environment=? FOR UPDATE", [id, b.env]);
      const { inv, payload } = await load(c, id, b.env);
      if (s.status === "sent") return { skip: "already_sent", inv };
      if (["submitting", "pending_confirmation"].includes(s.status) && !b.confirm_retry) return { skip: "needs_confirmation", inv };
      if (s.status !== "validated" && !(b.confirm_retry && ["submitting", "pending_confirmation", "submission_failed"].includes(s.status) && s.payload_hash)) return { skip: "not_validated", inv };
      if (s.payload_hash !== payloadHash(payload)) { await c.query("UPDATE fbr_invoice_state SET status='not_validated' WHERE invoice_id=? AND environment=?", [id, b.env]); return { skip: "changed", inv }; }
      await c.query("UPDATE fbr_invoice_state SET status='submitting', updated_by=? WHERE invoice_id=? AND environment=?", [req.user.id, id, b.env]);
      return { inv, payload };
    });
    const base = { id, invoice_number: claim.inv.invoice_number };
    const msgs = { already_sent: "Already sent to FBR — not sent again.", needs_confirmation: "A previous attempt has no confirmed result. Check FBR's portal first; then confirm to retry.", not_validated: "Validate this invoice successfully before sending.", changed: "The invoice changed after validation. Validate it again." };
    if (claim.skip) { results.push({ ...base, outcome: claim.skip, errors: [{ where: "Invoice", problem: msgs[claim.skip], fix: claim.skip === "needs_confirmation" ? "Use 'Retry unconfirmed' only if FBR shows no record of it." : "" }] }); continue; }
    const call = await callFbr(cfg.post_url, token, claim.payload, "POST", b.env);
    let outcome, errors = [], fbrNo = null;
    if (call.timedOut) { outcome = "pending_confirmation"; errors = [{ where: "Connection", problem: "FBR did not reply in time. It may or may not have received the invoice.", fix: "Check FBR's portal before retrying, to avoid a duplicate." }]; }
    else if (call.networkError) { outcome = "submission_failed"; errors = [{ where: "Connection", problem: "Could not reach FBR, so the invoice was not sent.", fix: "Check the internet connection and send again." }]; }
    else {
      const it = interpret(call.status, call.body); errors = it.errors;
      if (it.outcome === "valid" && it.invoiceNumber) { outcome = "sent"; fbrNo = it.invoiceNumber; }
      else if (it.outcome === "valid") { outcome = "pending_confirmation"; errors = [{ where: "FBR", problem: "FBR said valid but returned no FBR invoice number.", fix: "Check FBR's portal; the full reply is in history." }]; }
      else outcome = it.outcome === "invalid" ? "submission_failed" : it.outcome === "unauthorized" ? "submission_failed" : "pending_confirmation";
    }
    await tx(async (c) => {
      await c.query("UPDATE fbr_invoice_state SET status=?, fbr_invoice_number=COALESCE(?,fbr_invoice_number), submitted_at=IF(?='sent',NOW(),submitted_at), last_errors=?, updated_by=? WHERE invoice_id=? AND environment=?",
        [outcome, fbrNo, outcome, errors.length ? JSON.stringify(errors) : null, req.user.id, id, b.env]);
      if (b.env === "production") await c.query("UPDATE invoices SET fbr_status=?, fbr_invoice_number=COALESCE(?,fbr_invoice_number), fbr_submitted_at=IF(?='sent',NOW(),fbr_submitted_at), fbr_error_message=?, fbr_response=? WHERE id=?",
        [outcome, fbrNo, outcome, errors.map((e) => e.problem).join("; ") || null, call.body == null ? null : JSON.stringify(call.body), id]);
      await record(c, req.user, b.env, "submit", id, outcome, call.status, claim.payload, call.body, errors.map((e) => e.fbr_message || e.problem).join("; ") || null, fbrNo);
      await log(c, req.user, "fbr_submit", "invoices", id, claim.inv.invoice_number, null, { environment: b.env, outcome, fbr_invoice_number: fbrNo });
    });
    results.push({ ...base, outcome, fbr_invoice_number: fbrNo, errors });
  }
  res.json({ results });
}));

/* ---------- safe automatic fixes ---------- */
r.post("/fbr/autofix", need("validate"), wrap(async (req, res) => {
  const b = z.object({ env: Env, id: z.string().uuid(), fix: z.discriminatedUnion("type", [z.object({ type: z.literal("scenario"), value: z.string() }), z.object({ type: z.literal("uom"), line: z.number().int().min(0), value: z.string().max(200) })]) }).parse(req.body);
  await tx(async (c) => {
    const [[s]] = await c.query("SELECT status FROM fbr_invoice_state WHERE invoice_id=? AND environment='production'", [b.id]);
    if (s && ["sent", "submitting", "pending_confirmation"].includes(s.status)) throw bad("This invoice was sent to FBR and cannot be changed", 409);
    if (b.fix.type === "scenario") {
      if (!SCENARIOS[b.fix.value]) throw bad("Unknown scenario");
      await setState(c, b.id, b.env, { scenario_id: b.fix.value, status: "not_validated" }, req.user);
    } else {
      if (!(await refList("uom")).includes(b.fix.value)) throw bad("That UOM is not in FBR's list");
      const [items] = await c.query("SELECT id, uom FROM invoice_items WHERE invoice_id=? ORDER BY line_position, created_at", [b.id]);
      const it = items[b.fix.line]; if (!it) throw bad("Item not found", 404);
      await c.query("UPDATE invoice_items SET uom=? WHERE id=?", [b.fix.value, it.id]);
      await c.query("UPDATE fbr_invoice_state SET status='not_validated' WHERE invoice_id=?", [b.id]);
      await log(c, req.user, "fbr_autofix", "invoices", b.id, null, { uom: it.uom }, { uom: b.fix.value });
    }
  });
  res.json({ ok: true });
}));

r.get("/fbr/history", need("view"), wrap(async (req, res) => {
  const q = z.object({ env: Env, invoice_id: z.string().uuid().optional() }).parse(req.query);
  const [rows] = await pool.query(`SELECT h.id, h.invoice_id, i.invoice_number, h.action, h.outcome, h.http_status, h.fbr_invoice_number, h.error_message, h.user_name, h.created_at, h.request_json, h.response_json
    FROM fbr_submissions h LEFT JOIN invoices i ON i.id=h.invoice_id WHERE h.environment=? ${q.invoice_id ? "AND h.invoice_id=?" : ""} ORDER BY h.created_at DESC LIMIT 300`, q.invoice_id ? [q.env, q.invoice_id] : [q.env]);
  res.json(rows);
}));

export default r;
