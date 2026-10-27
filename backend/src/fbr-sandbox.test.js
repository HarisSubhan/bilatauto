import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from './fbr.js';
import { sandboxPayload, sellerFromSettings, sellerSettingsSchema } from './fbr-sandbox.js';
test('all 28 documented sandbox IDs are available', () => {
 assert.deepEqual(Object.keys(SCENARIOS), Array.from({length:28},(_,i)=>`SN${String(i+1).padStart(3,'0')}`));
 assert.equal(SCENARIOS.SN028[1], 'Goods at Reduced Rate');
});
test('seller Name, CNIC, NTN, Address and Province persistable settings are mapped server-side', () => {
 const s = sellerSettingsSchema.parse({ fbr_seller_name:'Seller',fbr_seller_cnic:'1234567890123',fbr_seller_ntn:'1234567',fbr_seller_address:'Karachi',fbr_seller_province:'SINDH',fbr_default_scenario:'SN028' });
 assert.deepEqual(sellerFromSettings(s),{name:'Seller',ntn:'1234567',address:'Karachi',province:'SINDH'});
 assert.equal(sellerFromSettings({...s,fbr_seller_ntn:''}).ntn,'1234567890123');
 assert.equal(sellerSettingsSchema.safeParse({...s,fbr_seller_cnic:'123'}).success,false);
});
const input={scenarioId:'SN001',invoiceType:'Sale Invoice',invoiceDate:'2026-10-20',invoiceRefNo:'',buyerNTNCNIC:'7654321',buyerBusinessName:'Buyer',buyerProvince:'PUNJAB',buyerAddress:'Lahore',buyerRegistrationType:'Registered',items:[{hsCode:'8708.2900',productDescription:'Body parts',rate:'18%',uoM:'Numbers, pieces, units',quantity:1,totalValues:118,valueSalesExcludingST:100,fixedNotifiedValueOrRetailPrice:0,salesTaxApplicable:18,salesTaxWithheldAtSource:0,extraTax:0,furtherTax:0,fedPayable:0,discount:0,sroScheduleNo:'',saleType:SCENARIOS.SN001[1],sroItemSerialNo:''}]};
test('Sandbox form preserves chosen scenario and tax fields but cannot override seller from settings',()=>{
 const p=sandboxPayload({...input,scenarioId:'SN028',sellerNTNCNIC:'9999999',items:[{...input.items[0],fedPayable:5,sroScheduleNo:'123'}]},{fbr_seller_ntn:'1234567',fbr_seller_name:'Saved Seller',fbr_seller_address:'Saved Address',fbr_seller_province:'SINDH'});
 assert.equal(p.scenarioId,'SN028');assert.equal(p.sellerNTNCNIC,'1234567');assert.equal(p.items[0].fedPayable,5);assert.equal(p.items[0].sroScheduleNo,'123');
 assert.throws(()=>sandboxPayload({...input,scenarioId:'SN029'},{}));
});
