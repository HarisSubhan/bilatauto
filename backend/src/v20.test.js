import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.FBR_SECRET_KEY = 'test-key';
const { buildPayload, precheck, assertValidationUrl, validationProtected } = await import('./fbr.js');
const { lineSchema, amounts } = await import('./document-rules.js');
const { needsRetailPrice, needsSro } = await import('./goods-rules.js');

const seller = { ntn: '7079463-0', name: 'Bilal Autos', address: 'Islamabad', province: 'PUNJAB' };
const inv = { invoice_date: '2026-10-26', buyer_ntn: '1234567', buyer_name: 'Buyer', address: 'Lahore', province: 'PUNJAB', buyer_type: 'Registered' };
const third = { fbr_hs_code: '8421.2300', fbr_description: 'Oil filters', quantity: 2, unit_price: 500, tax_percent: 18, uom: 'Numbers, pieces, units', type_of_goods: '3rd Schedule Goods', retail_sales_value: 1500 };

test('saved items with empty SRO, UOM and Type of Goods (null) can be edited and saved again', () => {
  const l = lineSchema.parse({ hs_code: '8421.2300', description: 'Filter', description_source: 'custom', quantity: '1.0000', unit_price: '500.000000', tax_percent: '18.00', item_kind: null, sro_schedule_no: null, sro_item_serial_no: null, type_of_goods: null, uom: null, part_number: null, retail_sales_value: null });
  assert.equal(l.sro_schedule_no, '');
  assert.equal(l.sro_item_serial_no, '');
  assert.equal(l.item_kind, 'goods');
});

test('3rd Schedule sales line charges 18% on the retail price 1500 → 270', () => {
  const a = amounts(third, 500, true);
  assert.equal(a.gross, 1000);
  assert.equal(a.tax, 270);
  assert.equal(a.total, 1270);
});

test('retail price never changes tax on purchases or standard-rate sales', () => {
  assert.equal(amounts(third, 500, false).tax, 180);
  assert.equal(amounts({ ...third, type_of_goods: 'Goods at standard rate (default)' }, 500, true).tax, 180);
});

test('FBR receives the retail price as fixedNotifiedValueOrRetailPrice', () => {
  const p = buildPayload({ inv, items: [{ ...third, sales_tax_value: 270 }], seller, environment: 'production' });
  assert.equal(p.items[0].fixedNotifiedValueOrRetailPrice, 1500);
  assert.equal(p.items[0].salesTaxApplicable, 270);
  assert.equal(p.items[0].valueSalesExcludingST, 1000);
  assert.equal(precheck(p, { environment: 'production' }).filter(i => i.field === 'Retail price').length, 0);
});

test('3rd Schedule without retail price is stopped before sending', () => {
  const p = buildPayload({ inv, items: [{ ...third, retail_sales_value: 0 }], seller, environment: 'production' });
  assert.ok(precheck(p, { environment: 'production' }).some(i => i.field === 'Retail price'));
});

test('reduced, zero-rate and exempt goods require SRO and item serial; standard rate does not', () => {
  for (const t of ['Goods at Reduced Rate', 'Goods at zero-rate', 'Exempt goods']) assert.ok(needsSro(t), t);
  assert.equal(needsSro('Goods at standard rate (default)'), false);
  assert.ok(needsRetailPrice('3rd Schedule Goods'));
  const p = buildPayload({ inv, items: [{ ...third, type_of_goods: 'Exempt goods', retail_sales_value: 0, sales_tax_value: 0, tax_percent: 0 }], seller, environment: 'production' });
  assert.ok(precheck(p, { environment: 'production' }).some(i => i.field === 'SRO'));
});

test('validation cannot target a submission endpoint',()=>{
  assert.throws(()=>assertValidationUrl('https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata','https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata'));
  assert.throws(()=>assertValidationUrl('https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb','https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata'));
  assert.doesNotThrow(()=>assertValidationUrl('https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata','https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata'));
});
test('revalidation must never reset sent, submitting or unconfirmed invoices',()=>{
  for(const status of ['sent','submitting','pending_confirmation']) assert.equal(validationProtected({status}),true);
  assert.equal(validationProtected({status:'validated',fbr_invoice_number:'FBR-402'}),true);
  assert.equal(validationProtected({status:'validation_failed'}),false);
});
test('FBR receives the actual invoice part name, not an unrelated full tariff heading',()=>{
  const p=buildPayload({inv,seller,items:[{...third,product_name:'Toyota steering column',description:'Steering column'}],environment:'production'});
  assert.equal(p.items[0].productDescription,'Toyota steering column');
});
