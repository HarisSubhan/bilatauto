import {test} from 'node:test';import assert from 'node:assert/strict';import {amounts,groupRows,checkProvided,lineSchema} from './document-rules.js';
test('Total Purchase Amount = Purchase Value + Sales Tax Charged; retail is independent',()=>{const a=amounts({quantity:2,discount:0,tax_percent:18,retail_sales_value:7500},5000);assert.equal(a.gross,10000);assert.equal(a.tax,1800);assert.equal(a.total,11800);});
test('Sales VAT is calculated GST on discounted goods value',()=>{const a=amounts({quantity:2,discount:1000,tax_percent:18},5000);assert.deepEqual(a,{gross:9000,tax:1620,total:10620});});
test('Service line uses the manual amount once, ignoring quantity',()=>{assert.deepEqual(amounts({item_kind:'service',quantity:3,discount:0,tax_percent:16},2000),{gross:2000,tax:320,total:2320});});
test('Service quantity defaults to 1 and service % is kept as entered',()=>{const l=lineSchema.parse({item_kind:'service',hs_code:'9987.0000',description:'Labour',unit_price:1500,service_percent:10,quantity:''});assert.equal(l.quantity,1);assert.equal(l.service_percent,10);assert.equal(amounts(l,1500).gross,1500);});
test('Goods still require units',()=>assert.throws(()=>lineSchema.parse({hs_code:'A',description:'A',unit_price:5})));
test('Blank invoice-number rows inherit invoice context and new numbers create groups',()=>{const groups=groupRows([{bill_number:'PI-1',purchase_date:'2026-10-20',hs_code:'A'},{hs_code:'B'},{bill_number:'PI-2',hs_code:'C'}],'purchase');assert.equal(groups.length,2);assert.equal(groups[0].rows.length,2);assert.equal(groups[0].header.purchase_date,'2026-10-20');});
test('Conflicting headers cannot be silently accepted',()=>assert.throws(()=>groupRows([{invoice_number:'S1',buyer:'A',hs_code:'1'},{buyer:'B',hs_code:'2'}],'invoice'),/Row 3: conflicting buyer/));
test('First continuation row is rejected',()=>assert.throws(()=>groupRows([{hs_code:'1'}],'purchase'),/invoice number/));
test('Calculated tax cannot be overridden',()=>assert.throws(()=>checkProvided({_row:5,sales_tax_value:123},'sales_tax_value',450),/Row 5/));

test("Database precision rejects more than two decimals",()=>assert.throws(()=>lineSchema.parse({hs_code:"A",description:"A",description_source:"custom",quantity:1.001,unit_price:10,discount:0,tax_percent:18}),/two decimal/));
