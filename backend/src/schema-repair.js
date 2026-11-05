// Brings an older live database up to the columns this server code needs.
// Checks known compatibility fields at startup; never drops columns or changes table collations.
import { pool } from "./db.js";

const MASTERS = ["departments", "suppliers", "fbr_hs_codes", "custom_hs_codes", "type_of_goods", "units_of_measurement", "sro_master", "buyer_types"];
const taxExpr = "ROUND((CASE WHEN retail_sales_value > 0 THEN retail_sales_value ELSE quantity * unit_price - discount END) * tax_percent / 100,2)";

export async function repairSchema(db = pool, log = console) {
  const [[{ name }]] = await db.query("SELECT DATABASE() AS name");
  const tables = async () => new Set((await db.query("SELECT TABLE_NAME t FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=?", [name]))[0].map((r) => r.t));
  const hasCol = async (t, c) => (await db.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?", [name, t, c]))[0].length > 0;
  const done = [];
  const have = await tables();

  for (const t of MASTERS) if (have.has(t) && !(await hasCol(t, "deleted_at"))) {
    await db.query(`ALTER TABLE \`${t}\` ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL`); done.push(`${t}.deleted_at`);
  }

  await db.query(`CREATE TABLE IF NOT EXISTS fbr_auto_sandbox (id TINYINT PRIMARY KEY, status VARCHAR(40) NOT NULL DEFAULT 'not_started',
    fbr_invoice_number VARCHAR(100), last_message TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await db.query("INSERT IGNORE INTO fbr_auto_sandbox(id,status) VALUES (1,'not_started')");

  for (const t of ["invoice_items", "quotation_items"]) if (have.has(t)) {
    const [[taxColumn]] = await db.query("SELECT EXTRA extra, GENERATION_EXPRESSION expression FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME='sales_tax_value'", [name, t]);
    if (taxColumn && (!/STORED GENERATED/i.test(taxColumn.extra || "") || !taxColumn.expression)) {
      throw new Error(`Database compatibility check stopped: ${t}.sales_tax_value is not the expected generated column. Existing values were preserved; back up and review the database before restarting.`);
    }
    if (!(await hasCol(t, "retail_sales_value"))) {
      await db.query(`ALTER TABLE \`${t}\` ADD COLUMN retail_sales_value DECIMAL(14,2) NOT NULL DEFAULT 0`);
      done.push(`${t}.retail_sales_value`);
    }
    const normalized = String(taxColumn?.expression || "").toLowerCase().replace(/[`\s()]/g, "");
    const expected = taxExpr.toLowerCase().replace(/[`\s()]/g, "");
    if (!taxColumn) {
      await db.query(`ALTER TABLE \`${t}\` ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (${taxExpr}) STORED`);
      done.push(`${t}.sales_tax_value`);
    } else if (normalized !== expected) {
      // Modify the verified generated column in place, including interrupted v20 upgrades.
      await db.query(`ALTER TABLE \`${t}\` MODIFY COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (${taxExpr}) STORED`);
      done.push(`${t}.sales_tax_value expression`);
    }
  }

  if (have.has("custom_hs_codes") && !(await hasCol("custom_hs_codes", "type_of_goods"))) {
    await db.query("ALTER TABLE custom_hs_codes ADD COLUMN type_of_goods VARCHAR(200) NULL"); done.push("custom_hs_codes.type_of_goods");
  }

  if (have.has("fbr_invoice_state")) {
    const [keys] = await db.query(`SELECT index_name FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='fbr_invoice_state' AND non_unique=0
      GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='invoice_id,environment'`, [name]);
    if (!keys.length) {
      const [dups] = await db.query("SELECT 1 FROM fbr_invoice_state GROUP BY invoice_id,environment HAVING COUNT(*)>1 LIMIT 1");
      if (dups.length) log.warn("Duplicate FBR state rows found; unique key not added. Reconcile them, keeping accepted FBR numbers.");
      else { await db.query("ALTER TABLE fbr_invoice_state ADD UNIQUE KEY ba_v203_invoice_environment(invoice_id,environment)"); done.push("fbr_invoice_state unique key"); }
    }
  }

  log.log(done.length ? `Database updated automatically: ${done.join(", ")}` : "Database structure is up to date");
  return done;
}
