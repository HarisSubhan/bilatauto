import { z } from 'zod';
import { validTaxId } from './tax-id.js';
import { needsRetailPrice } from './goods-rules.js';
export const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export const lineSchema = z.object({
 hs_code:z.coerce.string().trim().min(1).max(50),description:z.coerce.string().trim().min(1).max(20000),description_source:z.enum(['fbr','custom']).default('custom'),
 part_number:z.coerce.string().max(80).nullable().optional(),product_name:z.string().trim().max(250).nullable().optional(),
 quantity:z.preprocess(v=>v===''||v==null?undefined:v,z.coerce.number().finite().positive().max(999999999).optional()),unit_cost:z.coerce.number().finite().min(0).max(999999999).optional(),unit_price:z.coerce.number().finite().min(0).max(999999999).optional(),
 tax_percent:z.preprocess(v=>{if(typeof v==='string')v=v.replace(/[,%\s]/g,'');const x=v===''||v==null?0:Number(v);return Number.isFinite(x)&&x>0&&x<1?x*100:x;},z.coerce.number().finite().min(0).max(100).default(0)),
 item_kind:z.preprocess(v=>v==null||v===''?undefined:v,z.enum(['goods','service']).default('goods')),service_percent:z.union([z.coerce.number().finite().min(0).max(100),z.literal(''),z.null()]).optional().transform(v=>v===''||v==null?null:v),
 sro_schedule_no:z.string().trim().max(200).nullable().optional().transform(v=>v??''),sro_item_serial_no:z.string().trim().max(100).nullable().optional().transform(v=>v??''),
 retail_sales_value:z.preprocess(v=>v===''||v==null?undefined:v,z.coerce.number().finite().min(0).max(999999999).optional()),type_of_goods:z.string().trim().max(200).nullable().optional().transform(v=>v??undefined),uom:z.string().trim().max(30).nullable().optional().transform(v=>v??undefined),
 type_of_goods_id:z.string().uuid().nullable().optional(),uom_id:z.string().uuid().nullable().optional(),
}).refine(l=>[['quantity',4],['tax_percent',2],['service_percent',2],['retail_sales_value',2]].every(([k,pl])=>l[k]===undefined||l[k]===null||Math.abs(l[k]*10**pl-Math.round(l[k]*10**pl))<0.000001),'Too many decimal places (units allow 4, amounts 2)').transform(l=>({...l,quantity:l.quantity??(l.item_kind==='service'?1:undefined)})).refine(l=>l.quantity>0,'Units are required for goods');
/** Goods: gross = qty×price. Service (e.g. labour): gross = the manually entered service amount; quantity is informational. */
/** Sales lines (retailBase) of a retail-price Type of Goods (3rd Schedule) charge tax on the entered retail price. */
export function amounts(l, price, retailBase=false) { const svc=l.item_kind==='service',gross=round(svc?price:l.quantity*price),retail=Number(l.retail_sales_value??0),base=retailBase&&needsRetailPrice(l.type_of_goods)&&retail>0?retail:gross,tax=round(base*l.tax_percent/100);return {gross,tax,total:round(gross+tax)}; }
const present=v=>v!==undefined&&v!==null&&String(v).trim()!=='';
export function groupRows(rows, kind) {
 if(!Array.isArray(rows)||!rows.length||rows.length>10000)throw new Error('Import requires 1–10000 rows');
 const number=kind==='purchase'?'bill_number':'invoice_number';
 const headerKeys=kind==='purchase'?['purchase_date','supplier','supplier_ntn']:['invoice_date','buyer','buyer_ntn','vehicle_number'];
 const groups=[],seen=new Set();let current;
 for(let index=0;index<rows.length;index++){
  const r=rows[index]; const row=Number(r._row)||index+2;
  if(!Object.entries(r).some(([k,v])=>k!=='_row'&&present(v)))continue;
  const num=present(r[number])?String(r[number]).trim():'';
  if(num&&num!==current?.number){if(seen.has(num))throw new Error(`Row ${row}: invoice ${num} appears in separate groups`);seen.add(num);current={number:num,header:{},rows:[]};groups.push(current);}
  if(!current)throw new Error(`Row ${row}: enter an invoice number before continuation rows`);
  if(current.rows.length>=200)throw new Error(`Row ${row}: maximum 200 items per invoice`);
  for(const k of headerKeys){if(present(r[k])){if(present(current.header[k])&&String(current.header[k]).trim()!==String(r[k]).trim())throw new Error(`Row ${row}: conflicting ${k} for invoice ${current.number}`);current.header[k]=r[k];}}
  current.rows.push({...r,_row:row});
 }
 if(!groups.length)throw new Error('No populated product rows');
 return groups;
}
export function checkProvided(row,key,expected){if(present(row[key])&&(!Number.isFinite(Number(row[key]))||Math.abs(Number(row[key])-expected)>0.011))throw new Error(`Row ${row._row}: ${key} must equal calculated value ${expected.toFixed(2)}`);}
export const purchaseColumns=[['purchase_date','Purchase Date'],['bill_number','Purchase Invoice Number'],['supplier_ntn','Supplier NTN'],['supplier','supplier Business Name'],['hs_code','HS Code'],['type_of_goods','Type of Goods'],['description','Description'],['quantity','Quantity Units'],['uom','UOM'],['unit_cost','Unit Price'],['tax_percent','G.S.T Percentage'],['purchase_value','Purchase Value'],['sales_tax_charged','Sales Tax Charged'],['retail_sales_value','Retail Sales Value'],['total_purchase_amount','Total Purchase Amount']];
export const salesColumns=[['invoice_number','Sales Invoice Number'],['invoice_date','Invoice Date'],['buyer_ntn','Buyer NTN'],['buyer','buyer Name'],['vehicle_number','vehicle_number'],['hs_code','hs_code'],['description','description'],['quantity','quantity Units'],['unit_price','unit_price'],['sale_value','SALE value'],['tax_percent','GST %'],['sales_tax_value','Value Added Tax'],['type_of_goods','Type of Goods'],['uom','UOM'],['item_kind','Item Type (goods/service)'],['service_percent','Service %'],['buyer_type','Buyer Type'],['sro_schedule_no','SRO / Schedule'],['sro_item_serial_no','SRO Item Serial No'],['retail_sales_value','Fixed / Notified Value or Retail Price']];

/** Calendar date in YYYY-MM-DD. Past dates are allowed: back-dated quotations and invoices are legitimate. */
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Invalid calendar date');

/** Registered buyers need an IRIS NTN (alphabets supported) or a 13-digit CNIC. Validate supplied optional IDs too. */
export function buyerTaxIdOk(buyerType,taxNumber){return buyerType!=='Registered'&&!String(taxNumber??'').trim() ? true : validTaxId(taxNumber);}
