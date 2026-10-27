import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, precheck, interpret } from './fbr.js';
import { sellerSettingsSchema, sandboxPayload } from './fbr-sandbox.js';
import { buyerTaxIdOk } from './document-rules.js';
import { deleteMaster, DELETABLE_MASTERS } from './master-deletion.js';
import { runAutomaticSandbox, automaticSandboxPayload } from './fbr-auto-sandbox.js';
import { normalizeTaxId, validTaxId } from './tax-id.js';

const seller = { ntn: '7079463-0', name: 'Bilal Autos', address: 'Islamabad', province: 'CAPITAL TERRITORY' };
const inv = { invoice_date: '2026-10-26', tax_number: 'C01245-5', buyer_ntn: '012455', buyer_name: 'Khalid Bakery', address: 'Rawalpindi', province: 'PUNJAB', buyer_type: 'Unregistered' };
const items = [{ fbr_hs_code: '2710.1240', description: 'Petroleum', quantity: 1, unit_price: 100, tax_percent: 8, uom: 'Liter', type_of_goods: 'Goods (FED in ST Mode)' }];
const payload = buildPayload({ seller, inv, items, environment: 'production' });
test('all NTN alphabets are accepted and retained, not only C', () => {
  assert.equal(validTaxId('AB12345-6'), true);
  assert.equal(normalizeTaxId('AB12345-6'), 'AB12345');
  assert.equal(validTaxId('12AB345'), true);
  assert.equal(normalizeTaxId('12AB345'), '12AB345');
});
test('seller 7079463-0 saves unchanged and normalizes only at FBR boundary', () => {
  const saved = sellerSettingsSchema.parse({ fbr_seller_name: seller.name, fbr_seller_ntn: seller.ntn, fbr_seller_cnic: '', fbr_seller_address: seller.address, fbr_seller_province: seller.province, fbr_default_scenario: 'SN017' });
  assert.equal(saved.fbr_seller_ntn, '7079463-0');
  assert.equal(payload.sellerNTNCNIC, '7079463');
});
test('buyer C01245-5 retains C and corrected department overrides corrupted old snapshot', () => {
  assert.equal(payload.buyerNTNCNIC, 'C012455');
  assert.equal(buyerTaxIdOk('Registered', 'C01245-5'), true);
  assert.equal(buyerTaxIdOk('Unregistered', '012455'), false);
  assert.deepEqual(precheck(payload, { environment: 'production' }), []);
});
test('manual Sandbox uses the same buyer and seller normalization', () => {
  const sandbox = sandboxPayload({ ...payload, invoiceRefNo: '', scenarioId: 'SN017' }, { fbr_seller_ntn: seller.ntn, fbr_seller_name: seller.name, fbr_seller_address: seller.address, fbr_seller_province: seller.province });
  assert.equal(sandbox.buyerNTNCNIC, 'C012455'); assert.equal(sandbox.sellerNTNCNIC, '7079463');
});
test('quoted FBR 0002 response becomes structured invalid result', () => {
  const body = { validationResponse: { statusCode: '01', status: 'Invalid', errorCode: '0002', error: 'Buyer Registration No. is not in proper format.', invoiceStatuses: null } };
  const result = interpret(200, JSON.stringify(JSON.stringify(body)));
  assert.equal(result.outcome, 'invalid'); assert.equal(result.errors[0].code, '0002');
});
test('all master deletion paths retain rows and linked financial records', async () => {
  for (const table of DELETABLE_MASTERS) {
    const queries = [];
    const conn = { query: async (...args) => queries.push(args) };
    assert.equal(await deleteMaster(conn, table, ' WHERE id=?', ['buyer-id']), true);
    assert.equal(queries[0][0], `UPDATE \`${table}\` SET deleted_at=COALESCE(deleted_at,NOW()) WHERE id=?`);
    assert.deepEqual(queries[0][1], ['buyer-id']);
    assert.equal(queries.length, 1);
  }
  assert.equal(await deleteMaster({}, 'invoices', '', []), false);
});
const valid = { status: 200, body: { validationResponse: { statusCode: '00', status: 'Valid' } } };
function dependencies(overrides = {}) {
  return { payload, token: 'test-only', validateUrl: 'https://example.test/validate', postUrl: 'https://example.test/post', claim: async () => 'claimed', finish: async () => {}, call: async () => ({ ...valid, body: { ...valid.body, invoiceNumber: 'SANDBOX-1' } }), record: async () => {}, ...overrides };
}
test('production-only token skips Sandbox without blocking production', async () => {
  let claims = 0;
  const result = await runAutomaticSandbox(dependencies({ token: null, claim: async () => { claims++; return 'claimed'; } }));
  assert.equal(result.outcome, 'skipped'); assert.equal(claims, 0);
});
test('one click automatically validates then submits isolated SN017 Sandbox copy once', async () => {
  let state = 'not_started'; const calls = [];
  const deps = dependencies({ claim: async () => { if (state !== 'not_started') return state; state = 'running'; return 'claimed'; }, finish: async status => { state = status; }, call: async (url, token, p) => { calls.push([url, p]); return { ...valid, body: { ...valid.body, ...(url.endsWith('/post') ? { invoiceNumber: 'SANDBOX-1' } : {}) } }; } });
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'sent');
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'sent');
  assert.equal(calls.length, 2); assert.equal(calls[0][1].scenarioId, 'SN017');
  assert.equal('scenarioId' in payload, false); assert.notEqual(calls[0][1], payload);
});
test('automatic Sandbox failure does not throw and ambiguous post is not retried', async () => {
  let state = 'not_started'; let calls = 0;
  const deps = dependencies({ claim: async () => { if (state !== 'not_started') return state; state = 'running'; return 'claimed'; }, finish: async s => { state = s; }, call: async () => { calls++; return calls === 1 ? valid : { status: null, body: null, timedOut: true }; } });
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'pending_confirmation');
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'pending_confirmation');
  assert.equal(calls, 2);
  assert.equal(automaticSandboxPayload({ ...payload, items: [...payload.items, { ...payload.items[0], saleType: 'Services' }] }), null);
});