import { z } from 'zod';
export const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export const lineSchema = z.object({
 hs_code:z.string().trim().min(1).max(50),description:z.string().trim().min(1).max(2000),description_source:z.enum(['fbr','custom']).default('custom'),
 part_number:z.string().max(80).nullable().optional(),product_name:z.string().trim().max(250).nullable().optional(),
 quantity:z.preprocess(v=>v===''||v==null?undefined:v,z.coerce.number().finite().positive().max(999999999).optional()),unit_cost:z.coerce.number().finite().min(0).max(999999999).optional(),unit_price:z.coerce.number().finite().min(0).max(999999999).optional(),
 discount:z.coerce.number().finite().min(0).default(0),tax_percent:z.coerce.number().finite().min(0).max(100).default(0),
 item_kind:z.enum(['goods','service']).default('goods'),service_percent:z.union([z.coerce.number().finite().min(0).max(100),z.literal(''),z.null()]).optional().transform(v=>v===''||v==null?null:v),
 sro_schedule_no:z.string().trim().max(200).optional(),sro_item_serial_no:z.string().trim().max(100).optional(),
 retail_sales_value:z.coerce.number().finite().min(0).max(999999999).optional(),type_of_goods:z.string().trim().max(200).optional(),uom:z.string().trim().max(30).optional(),
 type_of_goods_id:z.string().uuid().nullable().optional(),uom_id:z.string().uuid().nullable().optional(),
}).refine(l=>['quantity','unit_cost','unit_price','discount','tax_percent','service_percent','retail_sales_value'].every(k=>l[k]===undefined||Math.abs(l[k]*100-Math.round(l[k]*100))<0.000001),'Use at most two decimal places').transform(l=>({...l,quantity:l.quantity??(l.item_kind==='service'?1:undefined),discount:l.item_kind==='service'?0:l.discount})).refine(l=>l.quantity>0,'Units are required for goods').refine(l=>l.item_kind==='service'||l.discount<=l.quantity*(l.unit_price??l.unit_cost??0),'Discount cannot exceed item value');
/** Goods: gross = qty×price − discount. Service (e.g. labour): gross = the manually entered service amount; quantity is informational. */
export function amounts(l, price) { const svc=l.item_kind==='service',gross=round(svc?price:l.quantity*price-l.discount),tax=round(gross*l.tax_percent/100);return {gross,tax,total:round(gross+tax)}; }
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
export const salesColumns=[['invoice_number','Sales Invoice Number'],['invoice_date','Invoice Date'],['buyer_ntn','Buyer NTN'],['buyer','buyer Name'],['vehicle_number','vehicle_number'],['hs_code','hs_code'],['description','description'],['quantity','quantity Units'],['unit_price','unit_price'],['sale_value','SALE value'],['tax_percent','GST %'],['sales_tax_value','Value Added Tax'],['type_of_goods','Type of Goods'],['uom','UOM'],['item_kind','Item Type (goods/service)'],['service_percent','Service %'],['buyer_type','Buyer Type'],['sro_schedule_no','SRO / Schedule'],['sro_item_serial_no','SRO Item Serial No']];
