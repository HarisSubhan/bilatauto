import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import { pool } from './db.js';
import router from './routes-fbr.js';
import { encryptToken } from './fbr.js';
import { loadEvidence } from './fbr-suggest.js';

// Opt-in integration test: point only at a disposable test database.
test('mixed general/unicode HS collations validate without posting or changing part identity', { skip: !process.env.COLLATION_TEST_PORT }, async () => {
  const db = await mysql.createConnection({ host: '127.0.0.1', port: Number(process.env.COLLATION_TEST_PORT), user: 'root', database: 'collation_test' });
  const originalQuery = pool.query, originalConnection = pool.getConnection, originalFetch = globalThis.fetch;
  const originalSecret = process.env.FBR_SECRET_KEY;
  const id = '00000000-0000-4000-8000-000000000401';
  const state = { invoice_id: id, environment: 'production', status: 'not_validated' };
  let calls = 0;
  try {
    process.env.FBR_SECRET_KEY = 'isolated-test-key';
    await db.query(`CREATE TEMPORARY TABLE fbr_hs_codes (id INT, serial_number INT, hs_code VARCHAR(20) COLLATE utf8mb4_general_ci, description TEXT, deleted_at DATETIME) DEFAULT CHARSET=utf8mb4`);
    await db.query(`CREATE TEMPORARY TABLE custom_hs_codes (hs_code VARCHAR(20) COLLATE utf8mb4_unicode_ci, fbr_hs_code VARCHAR(20) COLLATE utf8mb4_general_ci, type_of_goods VARCHAR(200), deleted_at DATETIME) DEFAULT CHARSET=utf8mb4`);
    await db.query(`CREATE TEMPORARY TABLE invoice_items (id VARCHAR(36), invoice_id VARCHAR(36), line_position INT, created_at DATETIME, hs_code VARCHAR(20) COLLATE utf8mb4_general_ci, fbr_hs_code VARCHAR(20) COLLATE utf8mb4_unicode_ci, description TEXT, product_name VARCHAR(250), part_number VARCHAR(100), quantity INT, unit_price DECIMAL(14,2), tax_percent INT, sales_tax_value DECIMAL(14,2), uom VARCHAR(100), type_of_goods VARCHAR(200), sro_schedule_no VARCHAR(100), sro_item_serial_no VARCHAR(100)) DEFAULT CHARSET=utf8mb4`);
    await db.query(`CREATE TEMPORARY TABLE fbr_invoice_state (invoice_id VARCHAR(36), environment VARCHAR(20), status VARCHAR(40), validated_at DATETIME) DEFAULT CHARSET=utf8mb4`);
    await db.query("INSERT INTO fbr_hs_codes VALUES (1,1,'8708.9420','HS steering description',NULL),(2,2,'8708.9420','Second description',NULL)");
    await db.query("INSERT INTO custom_hs_codes VALUES ('CUSTOM-1','8708.9420','Goods at standard rate (default)',NULL),('8708.9420','','Goods at standard rate (default)',NULL)");
    for (const invoiceId of [id, 'earlier']) await db.query('INSERT INTO invoice_items SET ?', { id: invoiceId, invoice_id: invoiceId, line_position: 1, created_at: new Date(), hs_code: 'CUSTOM-1', fbr_hs_code: '8708.9420', description: 'Manual description', product_name: 'Manual part name', part_number: 'PART-401', quantity: 1, unit_price: 100, tax_percent: 18, sales_tax_value: 18, uom: 'Numbers, pieces, units', type_of_goods: 'Goods at standard rate (default)' });
    await db.query("INSERT INTO fbr_invoice_state VALUES ('earlier','production','sent',NOW())");
    await assert.rejects(db.query('SELECT f.hs_code FROM fbr_hs_codes f JOIN invoice_items it ON f.hs_code=it.fbr_hs_code'), { code: 'ER_CANT_AGGREGATE_2COLLATIONS' });

    const rest = readFileSync(new URL('./rest.js', import.meta.url), 'utf8');
    const mapping = /const \[\[m\]\] = await c\.query\("([^"]+)"/.exec(rest)?.[1];
    assert.ok(mapping);
    for (const code of ['CUSTOM-1', '8708.9420']) assert.equal((await db.query(mapping, [code]))[0][0].hs_code, '8708.9420');
    const evidence = await loadEvidence(db, [{ hs_code: 'CUSTOM-1', fbr_hs_code: '8708.9420' }], 'production', id);
    assert.equal(evidence.master['CUSTOM-1'], 'Goods at standard rate (default)');
    assert.equal(evidence.accepted['8708.9420'].length, 1);

    const query = async (sql, args = []) => {
      if (sql.includes('FROM invoice_items it')) return db.query(sql, args);
      if (sql.includes('FROM fbr_config')) return [[{ connected: 1, token_enc: encryptToken('test-only'), validate_url: 'https://test.invalid/validateinvoicedata', post_url: 'https://test.invalid/postinvoicedata' }]];
      if (sql.includes('FROM fbr_reference')) return [[]];
      if (sql.includes('FROM invoices i')) return [[{ id, invoice_number: 'INV-401', invoice_date: '2026-10-27', department_name: 'Buyer', tax_number: '9012101-5', province: 'CAPITAL TERRITORY', address: 'Islamabad', buyer_type: 'Registered' }]];
      if (sql.includes('FROM system_settings')) return [[{ key: 'fbr_seller_ntn', value: '7079463' }, { key: 'fbr_seller_name', value: 'Bilal Autos' }, { key: 'fbr_seller_address', value: 'Islamabad' }, { key: 'fbr_seller_province', value: 'CAPITAL TERRITORY' }]];
      if (sql.includes('SELECT * FROM fbr_invoice_state')) return [[{ ...state }]];
      if (sql.startsWith('UPDATE fbr_invoice_state SET ?')) { Object.assign(state, args[0]); return [{ affectedRows: 1 }]; }
      if (sql.startsWith('INSERT IGNORE INTO fbr_invoice_state') || sql.startsWith('INSERT INTO fbr_submissions')) return [{ affectedRows: 1 }];
      throw new Error('Unexpected query: ' + sql);
    };
    pool.query = query;
    pool.getConnection = async () => ({ query, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} });
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://test.invalid/validateinvoicedata');
      const payload = JSON.parse(options.body);
      assert.equal(payload.items.length, 1);
      assert.equal(payload.items[0].productDescription, 'Manual part name');
      calls++;
      return new Response(JSON.stringify({ validationResponse: { statusCode: '00', status: 'Valid', invoiceStatuses: [] } }));
    };
    const handler = router.stack.find(l => l.route?.path === '/fbr/validate')?.route.stack.at(-1)?.handle;
    assert.ok(handler);
    const result = await new Promise((resolve, reject) => handler({ body: { env: 'production', ids: [id] }, user: { id: 'user', full_name: 'Test' } }, { json: resolve }, reject));
    assert.equal(result.results[0].outcome, 'valid');
    assert.equal(state.status, 'validated');
    assert.equal(calls, 1);
    const [[saved]] = await db.query('SELECT product_name,part_number FROM invoice_items WHERE invoice_id=?', [id]);
    assert.deepEqual(saved, { product_name: 'Manual part name', part_number: 'PART-401' });
  } finally {
    pool.query = originalQuery; pool.getConnection = originalConnection; globalThis.fetch = originalFetch;
    if (originalSecret === undefined) delete process.env.FBR_SECRET_KEY; else process.env.FBR_SECRET_KEY = originalSecret;
    await db.end(); await pool.end();
  }
});