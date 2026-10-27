import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repairSchema } from './schema-repair.js';

function database(column, retail = true) {
  const queries = [];
  return { queries, async query(sql, args = []) {
    queries.push(sql);
    if (sql.startsWith('SELECT DATABASE')) return [[{ name: 'isolated' }]];
    if (sql.includes('INFORMATION_SCHEMA.TABLES')) return [[{ t: 'invoice_items' }]];
    if (sql.includes('GENERATION_EXPRESSION')) return [column ? [column] : []];
    if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) return [retail ? [{ found: 1 }] : []];
    return [[]];
  } };
}
const quiet = { log() {}, warn() {} };
const expression = 'ROUND((CASE WHEN retail_sales_value > 0 THEN retail_sales_value ELSE quantity * unit_price - discount END) * tax_percent / 100,2)';

test('existing manually stored tax values are preserved, never dropped or overwritten', async () => {
  const db = database({ extra: '', expression: '' }, false);
  await assert.rejects(repairSchema(db, quiet), /Existing values were preserved/);
  assert.equal(db.queries.some(sql => /ALTER TABLE.*invoice_items/i.test(sql)), false);
});
test('interrupted retail upgrade repairs only the verified generated calculation without dropping columns', async () => {
  const db = database({ extra: 'STORED GENERATED', expression: 'ROUND(quantity * unit_price * tax_percent / 100,2)' });
  await repairSchema(db, quiet);
  assert.equal(db.queries.filter(sql => /MODIFY COLUMN sales_tax_value/.test(sql)).length, 1);
  assert.equal(db.queries.some(sql => /DROP|DELETE|CONVERT TO/i.test(sql)), false);
});
test('matching retail calculation needs no alteration on repeated startup', async () => {
  const db = database({ extra: 'STORED GENERATED', expression });
  await repairSchema(db, quiet);
  await repairSchema(db, quiet);
  assert.equal(db.queries.some(sql => /ALTER TABLE/i.test(sql)), false);
});