import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { pool,tx,nextNumber } from './db.js';
import { log } from './log.js';
import { needsRetailPrice } from './goods-rules.js';
import {buyerTaxIdOk, amounts,lineSchema,round,groupRows,checkProvided,purchaseColumns,salesColumns,dateSchema } from './document-rules.js';
const fail=(m,s=400)=>{const e=new Error(m);e.status=s;throw e;};
const permitted=(u,m,a)=>u.roles.includes('super_admin')||u.permissions.includes(`${m}:${a}`);
const date=dateSchema;
const headerSchema=z.object({date,department_id:z.string().uuid().optional(),supplier_id:z.string().uuid().optional(),bill_number:z.string().trim().max(80).optional(),invoice_number:z.string().trim().max(40).optional(),reference_number:z.string().max(80).optional(),notes:z.string().max(5000).nullable().optional(),vehicle_type:z.string().max(100).nullable().optional(),vehicle_number:z.string().max(100).nullable().optional(),valid_until:z.union([date,z.literal('')]).nullable().optional(),contact_person:z.string().max(150).nullable().optional(),buyer_type:z.enum(['Registered','Unregistered']).optional()});
async function master(c,t,id,name,required){
 if(!id&&!name){if(required)fail(`${t==='type_of_goods'?'Type of Goods':'UOM'} is required`);return null;}
 const [rows]=await c.query(`SELECT * FROM ${t} WHERE ${id?'id':'name'}=? AND status='active' AND deleted_at IS NULL`,[id||name]);
 if(rows.length!==1)fail(`Invalid or inactive ${t==='type_of_goods'?'Type of Goods':'UOM'}: ${name||id}`);
 return rows[0];
}
async function prepare(c,kind,input,items,resolveFbr){
 const h=headerSchema.parse(input),module=kind==='purchase'?'purchases':kind==='quotation'?'quotations':'invoices';
 if(!Array.isArray(items)||!items.length||items.length>200)fail('Add between 1 and 200 items');
 const partyTable=kind==='purchase'?'suppliers':'departments',partyId=kind==='purchase'?h.supplier_id:h.department_id;
 if(!partyId)fail('Select a supplier or buyer');
 const [[party]]=await c.query(`SELECT * FROM ${partyTable} WHERE id=? AND status='active' AND deleted_at IS NULL`,[partyId]);if(!party)fail('Supplier or buyer is deleted, inactive or unknown');
 if(kind==='purchase'&&!h.bill_number)fail('Purchase Invoice Number is required');
 if(kind!=='purchase'&&!h.vehicle_type?.trim()&&!h.vehicle_number?.trim())fail('Vehicle type or vehicle number is required');
 if(kind!=='purchase'){const bt=h.buyer_type||(party.registration_type==='Registered'||party.registration_type==='Unregistered'?party.registration_type:undefined);if(!bt)fail('Choose a buyer type (Registered or Unregistered)');if(!buyerTaxIdOk(bt,party.tax_number))fail('Enter a valid buyer IRIS NTN or 13-digit CNIC in Departments / Buyers. NTN letters and dashes are supported. An unavailable NTN can be blank for an Unregistered buyer.');h.buyer_type=bt;}
 const pk=kind==='purchase'?'unit_cost':'unit_price',valid=[];let sub=0,tax=0;
 for(const raw of items){
  const it=lineSchema.parse(raw);if(it[pk]===undefined)fail(it.item_kind==='service'?'Service amount is required':'Unit price is required');if(kind==='purchase'&&it.item_kind==='service')fail('Purchases contain goods only');
  if(it.sro_schedule_no){const [[sro]]=await c.query("SELECT id FROM sro_master WHERE name=? AND status='active' AND deleted_at IS NULL",[it.sro_schedule_no]);if(!sro)fail(`Unknown or inactive SRO: ${it.sro_schedule_no}`);}
  if(kind==='quotation'&&!it.product_name?.trim())fail('Product Name is required');
  const source=it.description_source==='fbr'?'fbr_hs_codes':'custom_hs_codes';
  const [[hs]]=await c.query(`SELECT id FROM ${source} WHERE hs_code=? AND deleted_at IS NULL LIMIT 1`,[it.hs_code]);if(!hs)fail(`Unknown HS code ${it.hs_code}`);
  const fbr=kind==='purchase'?null:await resolveFbr(c,it.hs_code);if(kind!=='purchase'&&!fbr)fail(`HS code ${it.hs_code} has no FBR mapping`);
  const goods=await master(c,'type_of_goods',it.type_of_goods_id,it.type_of_goods,kind!=='quotation');
  const uom=await master(c,'units_of_measurement',it.uom_id,it.uom,kind!=='quotation'&&it.item_kind!=='service');
  if(kind==='purchase'&&it.retail_sales_value===undefined)fail('Retail Sales Value is required (manual entry)');
  const retail=kind!=='purchase'&&needsRetailPrice(goods?.name);if(retail&&kind==='invoice'&&!(Number(it.retail_sales_value)>0))fail(`Enter the Fixed / Notified Value or Retail Price for ${goods.name}`);
  if(kind!=='purchase')it.retail_sales_value=retail?Number(it.retail_sales_value||0):0;
  const calc=amounts({...it,type_of_goods:goods?.name},it[pk],kind!=='purchase');
  sub=round(sub+(it.item_kind==='service'?round(it[pk]):round(it.quantity*it[pk])));tax=round(tax+calc.tax);
  const row={hs_code:it.hs_code,description:it.description,description_source:it.description_source,part_number:it.part_number||null,product_name:it.product_name||null,quantity:it.quantity,uom:uom?.name||null,uom_id:uom?.id||null,type_of_goods:goods?.name||null,type_of_goods_id:goods?.id||null,[pk]:it[pk],tax_percent:it.tax_percent,line_total:calc.total,line_position:valid.length+1};
  if(kind==='purchase')row.retail_sales_value=it.retail_sales_value;else Object.assign(row,{fbr_hs_code:fbr,item_kind:it.item_kind,service_percent:it.item_kind==='service'?it.service_percent:null,sro_schedule_no:it.sro_schedule_no||null,sro_item_serial_no:it.sro_item_serial_no||null,retail_sales_value:it.retail_sales_value,labor_percent:0,labor_amount:0});valid.push(row);
 }
 return {h,party,valid,module,totals:{subtotal:sub,tax_total:tax,labor_amount:0,grand_total:round(sub+tax)}};
}
async function replayStock(c,codes){
 for(const code of codes){
  const [moves]=await c.query("SELECT * FROM stock_movements WHERE hs_code=? ORDER BY movement_date,created_at,id FOR UPDATE",[code]);
  let balance=0;
  for(const m of moves){if(m.direction==='in'){balance=round(balance+Number(m.quantity));continue;}
   const shortfall=Math.max(round(Number(m.quantity)-balance),0);const before=balance;balance=Math.max(round(balance-Number(m.quantity)),0);
   await c.query("DELETE FROM stock_movements WHERE id=?",[m.id]);await c.query("INSERT INTO stock_movements SET ?",[{...m,available_before:before,shortfall}]);
  }
 }
}
export function registerDocuments(r,{afterUpdate,stockOutForInvoice,resolveFbr}){
 async function save(c,kind,p,user,imported=false){
  const {h,party,valid,module,totals}=p;
  const id=randomUUID(),number=await nextNumber(c,kind==='purchase'?'PUR':kind==='quotation'?'QUO':'INV');
  if(kind==='purchase'){const [[duplicate]]=await c.query('SELECT id FROM purchases WHERE bill_number=? FOR UPDATE',[h.bill_number]);if(duplicate)fail(`Purchase invoice ${h.bill_number} already exists`,409);}
  if(imported){const [[duplicate]]=await c.query('SELECT id FROM invoices WHERE invoice_number=? OR sales_tax_number=? FOR UPDATE',[h.invoice_number,h.invoice_number]);if(duplicate)fail(`Sales invoice ${h.invoice_number} already exists`,409);}
  const row={id,subtotal:totals.subtotal,tax_total:totals.tax_total,grand_total:totals.grand_total,created_by:user.id,notes:h.notes||null,verification:'unverified'};
  if(kind==='purchase')Object.assign(row,{purchase_number:number,purchase_date:h.date,supplier_id:party.id,supplier_name:party.name,supplier_ntn:party.tax_number,bill_number:h.bill_number,reference_number:h.reference_number||null});
  else if(kind==='quotation')Object.assign(row,{quotation_number:number,quotation_date:h.date,department_id:party.id,valid_until:h.valid_until||null,contact_person:h.contact_person||null,vehicle_type:h.vehicle_type||null,vehicle_number:h.vehicle_number||null,buyer_type:h.buyer_type||null,labor_percent:0,labor_amount:0,status:'draft'});
  else Object.assign(row,{invoice_number:imported?h.invoice_number:number,sales_tax_number:await nextNumber(c,'STI'),invoice_date:h.date,department_id:party.id,buyer_name:party.name,buyer_ntn:party.tax_number,vehicle_type:h.vehicle_type||null,vehicle_number:h.vehicle_number||null,buyer_type:h.buyer_type||null,labor_percent:0,labor_amount:0,status:'approved',source:'manual',fbr_status:'offline'});
  await c.query(`INSERT INTO ${module} SET ?`,[row]);for(const it of valid)await c.query(`INSERT INTO ${kind}_items SET ?`,[{id:randomUUID(),[`${kind}_id`]:id,...it}]);
  if(kind!=='quotation'){await c.query(`UPDATE ${module} SET verification='verified' WHERE id=?`,[id]);await afterUpdate(c,module,row,{...row,verification:'verified'},user);}
  if(imported){const m=h.invoice_number.match(/^INV-(\d+)$/);if(m)await c.query("UPDATE document_counters SET last_value=GREATEST(last_value,?) WHERE prefix='INV'",[Number(m[1])]);}
  await log(c,user,'insert',module,id,row.invoice_number||row.purchase_number||row.quotation_number,null,row);return id;
 }
 r.post('/rpc/create_document',async(req,res,next)=>{try{const {_kind:k,_header:h,_items:items}=req.body;if(!['purchase','quotation','invoice'].includes(k))fail('Invalid document kind');const m=k==='purchase'?'purchases':k==='quotation'?'quotations':'invoices';if(!permitted(req.user,m,'create'))fail('Create permission required',403);res.json({data:await tx(async c=>save(c,k,await prepare(c,k,h,items,resolveFbr),req.user))});}catch(e){next(e);}});
 r.post('/rpc/import_documents',async(req,res,next)=>{try{
  const {_kind:k,_rows:rows}=req.body;if(!['purchase','invoice'].includes(k))fail('Invalid import kind');const module=k==='purchase'?'purchases':'invoices';if(!permitted(req.user,module,'create'))fail('Create permission required',403);
  const result=await tx(async c=>{
   // Serialize imports and manual number allocation using the same counter row; duplicate checks stay inside the transaction.
   await c.query("SELECT prefix FROM document_counters WHERE prefix IN ('PUR','INV') ORDER BY prefix FOR UPDATE");
   const groups=groupRows(rows,k),prepared=[],errors=[];
   for(const g of groups){try{
    const partyTable=k==='purchase'?'suppliers':'departments',name=g.header[k==='purchase'?'supplier':'buyer'],ntn=g.header[k==='purchase'?'supplier_ntn':'buyer_ntn'];
    if(!name||!ntn)fail('Supplier/buyer business name and NTN are required');
    const [parties]=await c.query(`SELECT * FROM ${partyTable} WHERE TRIM(name)=? AND TRIM(tax_number)=? AND status='active' AND deleted_at IS NULL`,[String(name).trim(),String(ntn).trim()]);if(parties.length!==1)fail('Business name and NTN must match exactly one active supplier/buyer');
    const h={date:g.header[k==='purchase'?'purchase_date':'invoice_date'],[k==='purchase'?'supplier_id':'department_id']:parties[0].id,[k==='purchase'?'bill_number':'invoice_number']:g.number,vehicle_number:g.header.vehicle_number,...(g.rows.find(r=>r.buyer_type)?{buyer_type:String(g.rows.find(r=>r.buyer_type).buyer_type).trim()}:{})};
    for(const raw of g.rows){try{const it=lineSchema.parse({...raw,description_source:'custom'}),a=amounts(it,it[k==='purchase'?'unit_cost':'unit_price'],k!=='purchase');if(k==='purchase'){checkProvided(raw,'purchase_value',a.gross);checkProvided(raw,'sales_tax_charged',a.tax);checkProvided(raw,'total_purchase_amount',a.total);}else{checkProvided(raw,'sale_value',a.gross);checkProvided(raw,'sales_tax_value',a.tax);}}catch(e){fail(`Row ${raw._row}: ${e.message}`);}}
    const [[existing]]=await c.query(`SELECT id FROM ${module} WHERE ${k==='purchase'?'bill_number':'invoice_number'}=? FOR UPDATE`,[g.number]);if(existing)fail(`${k==='purchase'?'Purchase':'Sales'} invoice ${g.number} already exists`,409);
    prepared.push(await prepare(c,k,h,g.rows.map(r=>({...r,description_source:'custom'})),resolveFbr));
   }catch(e){errors.push(`Row ${g.rows[0]._row}, invoice ${g.number}: ${e.message}`);}}
   if(errors.length)fail(errors.join("\n"));
   const ids=[];for(const p of prepared)ids.push(await save(c,k,p,req.user,k==='invoice'));return {ids,invoices:ids.length,rows:rows.length,rejected:0};
  });res.json({data:result});
 }catch(e){next(e);}});
 r.post('/rpc/update_document',async(req,res,next)=>{try{
  const {_kind:k,_id:id,_header:h,_items:items}=req.body;if(!['invoice','quotation'].includes(k))fail('Invalid edit kind');z.string().uuid().parse(id);const module=k==='invoice'?'invoices':'quotations';if(!permitted(req.user,module,'edit'))fail('Edit permission required',403);
  await tx(async c=>{const [[old]]=await c.query(`SELECT * FROM ${module} WHERE id=? FOR UPDATE`,[id]);if(!old)fail('Document not found',404);if(k==='invoice'){const [[fs]]=await c.query("SELECT status FROM fbr_invoice_state WHERE invoice_id=? AND environment='production' AND status IN ('sent','submitting','pending_confirmation')",[id]);if(fs)fail('This invoice was sent to FBR and can no longer be edited',409);}if(k==='quotation'&&old.status!=='draft')fail('Only draft quotations can be edited');
   const p=await prepare(c,k,h,items,resolveFbr);const row={...p.totals,department_id:p.party.id,vehicle_type:p.h.vehicle_type||null,vehicle_number:p.h.vehicle_number||null,buyer_type:p.h.buyer_type||null,notes:p.h.notes||null,[k==='invoice'?'invoice_date':'quotation_date']:p.h.date};
   if(k==='invoice')Object.assign(row,{buyer_name:old.department_id===p.party.id?(old.buyer_name??p.party.name):p.party.name,buyer_ntn:old.department_id===p.party.id?(old.buyer_ntn??p.party.tax_number):p.party.tax_number});else Object.assign(row,{valid_until:p.h.valid_until||null,contact_person:p.h.contact_person||null});
   const [previousItems]=await c.query(`SELECT hs_code FROM ${k}_items WHERE ${k}_id=?`,[id]);
   await c.query(`UPDATE ${module} SET ? WHERE id=?`,[row,id]);await c.query(`DELETE FROM ${k}_items WHERE ${k}_id=?`,[id]);for(const it of p.valid)await c.query(`INSERT INTO ${k}_items SET ?`,[{id:randomUUID(),[`${k}_id`]:id,...it}]);
   if(k==='invoice'){await c.query("DELETE FROM stock_movements WHERE reference_type='invoice' AND reference_id=?",[id]);if(old.verification==='verified')await stockOutForInvoice(c,{...old,...row},req.user);await replayStock(c,[...new Set([...previousItems.map(it=>it.hs_code),...p.valid.map(it=>it.hs_code)])]);}
   await log(c,req.user,'update',module,id,old.invoice_number||old.quotation_number,old,{...old,...row});
  });res.json({data:id});
 }catch(e){next(e);}});
 r.post('/rpc/document_template',async(req,res,next)=>{try{
  const k=z.enum(['purchase','invoice']).parse(req.body._kind);if(!permitted(req.user,k==='purchase'?'purchases':'invoices','view'))fail('View permission required',403);
  const cols=k==='purchase'?purchaseColumns:salesColumns,wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Data'),lists=wb.addWorksheet('Master Values',{state:'veryHidden'});
  ws.columns=cols.map(([key,header])=>({key,header,width:Math.max(18,header.length+2)}));ws.getRow(1).font={bold:true,name:'Arial'};ws.views=[{state:'frozen',ySplit:1}];
  const [goods]=await pool.query("SELECT name FROM type_of_goods WHERE status='active' AND deleted_at IS NULL ORDER BY serial_number"),[uoms]=await pool.query("SELECT name FROM units_of_measurement WHERE status='active' AND deleted_at IS NULL ORDER BY serial_number");
  const [sros]=k==='purchase'?[[]]:await pool.query("SELECT name FROM sro_master WHERE status='active' AND deleted_at IS NULL ORDER BY serial_number"),[btypes]=k==='purchase'?[[]]:await pool.query("SELECT name FROM buyer_types WHERE status='active' AND deleted_at IS NULL ORDER BY serial_number"),kinds=k==='purchase'?[]:[{name:'goods'},{name:'service'}];
  goods.forEach((v,i)=>lists.getCell(i+1,1).value=v.name);uoms.forEach((v,i)=>lists.getCell(i+1,2).value=v.name);sros.forEach((v,i)=>lists.getCell(i+1,3).value=v.name);btypes.forEach((v,i)=>lists.getCell(i+1,4).value=v.name);kinds.forEach((v,i)=>lists.getCell(i+1,5).value=v.name);
  for(let row=2;row<=1001;row++){
   for(const [key,col,values] of [['type_of_goods','A',goods],['uom','B',uoms],['sro_schedule_no','C',sros],['buyer_type','D',btypes],['item_kind','E',kinds]]){const index=cols.findIndex(([k])=>k===key)+1;if(index&&values.length)ws.getCell(row,index).dataValidation={type:'list',allowBlank:key!=='type_of_goods',formulae:[`'Master Values'!$${col}$1:$${col}$${values.length}`],showErrorMessage:true,errorTitle:'Invalid value',error:'Select a configured master value.'};}
   const formula=(key,f)=>{ws.getCell(row,cols.findIndex(([k])=>k===key)+1).value={formula:f};};
   const letter=key=>ws.getColumn(cols.findIndex(([k])=>k===key)+1).letter;
   const qty=`${letter('quantity')}${row}`,price=`${letter(k==='purchase'?'unit_cost':'unit_price')}${row}`,tax=`${letter('tax_percent')}${row}`;
   const grossKey=k==='purchase'?'purchase_value':'sale_value',gstKey=k==='purchase'?'sales_tax_charged':'sales_tax_value';
   formula(grossKey,k==='purchase'?`IF(OR(${qty}="",${price}=""),"",ROUND(${qty}*${price},2))`:`IF(${price}="","",IF(${letter('item_kind')}${row}="service",ROUND(${price},2),IF(${qty}="","",ROUND(${qty}*${price},2))))`);formula(gstKey,k==='purchase'?`IF(${letter(grossKey)}${row}="","",ROUND(${letter(grossKey)}${row}*${tax}/100,2))`:`IF(${letter(grossKey)}${row}="","",IF(N(${letter('retail_sales_value')}${row})>0,ROUND(${letter('retail_sales_value')}${row}*${tax}/100,2),ROUND(${letter(grossKey)}${row}*${tax}/100,2)))`);
   if(k==='purchase')formula('total_purchase_amount',`IF(${letter(grossKey)}${row}="","",${letter(grossKey)}${row}+${letter(gstKey)}${row})`);
   for(const [key]of cols){ws.getCell(row,cols.findIndex(([k])=>k===key)+1).font={name:'Arial'};if(['hs_code','bill_number','invoice_number','supplier_ntn','buyer_ntn','uom'].includes(key))ws.getCell(row,cols.findIndex(([k])=>k===key)+1).numFmt='@';}
  }
  wb.calcProperties.fullCalcOnLoad=true;const buffer=await wb.xlsx.writeBuffer();res.json({data:{filename:k==='purchase'?'Bilal_Software_Purchase.xlsx':'Bilal_Sales_Invoice.xlsx',base64:buffer.toString('base64')}});
 }catch(e){next(e);}});
}
