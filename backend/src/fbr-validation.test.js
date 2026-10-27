import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pool} from './db.js';
import router from './routes-fbr.js';
import {encryptToken} from './fbr.js';

test('repeated invoice validation changes one state only, never posts or creates financial invoices',async()=>{
  process.env.FBR_SECRET_KEY='isolated-test-key';
  const originalQuery=pool.query, originalConnection=pool.getConnection, originalFetch=globalThis.fetch;
  const id='00000000-0000-4000-8000-000000000402';
  const state={invoice_id:id,environment:'production',status:'not_validated'};
  let writes=0,posts=0;
  const queries=[];
  const query=async(sql,args=[])=>{
    queries.push(sql);
    if(sql.includes('FROM fbr_config'))return [[{connected:1,token_enc:encryptToken('test-only'),validate_url:'https://test.invalid/validateinvoicedata',post_url:'https://test.invalid/postinvoicedata'}]];
    if(sql.includes('FROM fbr_reference'))return [[]];
    if(sql.includes('FROM invoices i'))return [[{id,invoice_number:'INV-402',invoice_date:'2026-10-27',department_name:'Buyer',tax_number:'9012101',province:'CAPITAL TERRITORY',address:'Islamabad',buyer_type:'Registered',fbr_state:state.status}]];
    if(sql.includes('FROM invoice_items it'))return [[{id:'line',hs_code:'8708.9420',description:'Steering column',quantity:1,unit_price:100,tax_percent:18,sales_tax_value:18,uom:'Numbers, pieces, units',type_of_goods:'Goods at standard rate (default)'}]];
    if(sql.includes('FROM system_settings'))return [[{key:'fbr_seller_ntn',value:'7079463'},{key:'fbr_seller_name',value:'Bilal Autos'},{key:'fbr_seller_address',value:'Islamabad'},{key:'fbr_seller_province',value:'CAPITAL TERRITORY'}]];
    if(sql.includes('SELECT * FROM fbr_invoice_state'))return [[{...state}]];
    if(sql.startsWith('UPDATE fbr_invoice_state SET ?')){writes++;Object.assign(state,args[0]);return [{affectedRows:1}];}
    if(sql.startsWith('INSERT IGNORE INTO fbr_invoice_state')||sql.startsWith('INSERT INTO fbr_submissions'))return [{affectedRows:1}];
    throw new Error('Unexpected query: '+sql);
  };
  pool.query=query;
  pool.getConnection=async()=>({query,beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}});
  globalThis.fetch=async(url)=>{assert.equal(url,'https://test.invalid/validateinvoicedata');posts++;return new Response(JSON.stringify({validationResponse:{statusCode:'00',status:'Valid',invoiceStatuses:[]}}));};
  const layer=router.stack.find(l=>l.route?.path==='/fbr/validate');
  const handler=layer?.route.stack.at(-1)?.handle;
  assert.ok(handler);
  const run=()=>new Promise((resolve,reject)=>handler({body:{env:'production',ids:[id,id]},user:{id:'user',full_name:'Test'}},{json:resolve},reject));
  try {
    for(let i=0;i<3;i++){const result=await run();assert.equal(result.results.length,1);assert.equal(result.results[0].outcome,'valid');}
    assert.equal(posts,3);assert.equal(writes,3);assert.equal(state.status,'validated');
    assert.equal(queries.some(q=>/^INSERT INTO invoices\b/.test(q)),false);
    state.status='pending_confirmation';
    const result=await run();assert.equal(result.results[0].outcome,'needs_confirmation');assert.equal(posts,3);assert.equal(writes,3);
  } finally {pool.query=originalQuery;pool.getConnection=originalConnection;globalThis.fetch=originalFetch;await pool.end();}
});