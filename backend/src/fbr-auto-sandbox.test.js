import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { automaticSandboxPayload, runAutomaticSandbox } from './fbr-auto-sandbox.js';

const payload = {
  invoiceType: 'Sale Invoice', invoiceDate: '2026-10-26',
  sellerNTNCNIC: '7079463', buyerNTNCNIC: 'C012455', buyerRegistrationType: 'Unregistered',
  items: [{ saleType: 'Goods at standard rate (default)', hsCode: '8708.9990', quantity: 1, salesTaxApplicable: 18, valueSalesExcludingST: 100 }],
};
const valid = { validationResponse: { statusCode: '00', status: 'Valid' } };
function setup(overrides = {}) {
  let state = 'not_started';
  const records = [], finishes = [];
  return {
    records, finishes,
    deps: {
      payload, token: 'local-test-token', validateUrl: 'http://local.test/validate', postUrl: 'http://local.test/post',
      claim: async () => { if (state !== 'not_started') return state; state = 'running'; return 'claimed'; },
      finish: async (outcome, number, message) => { state = outcome; finishes.push({ outcome, number, message }); },
      record: async (...args) => { records.push(args); },
      call: async url => ({ status: 200, body: url.endsWith('/post') ? { ...valid, invoiceNumber: 'LOCAL-SANDBOX-1' } : valid }),
      ...overrides,
    },
  };
}

test('automatic Sandbox creates and sends an isolated invoice through HTTP validation and submission', async () => {
  const received = [];
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    received.push({ path: req.url, authorization: req.headers.authorization, payload: JSON.parse(raw) });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(req.url === '/post' ? { ...valid, invoiceNumber: 'LOCAL-SANDBOX-1' } : valid));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const origin = `http://127.0.0.1:${address.port}`;
    const before = structuredClone(payload);
    const { deps, records } = setup({
      validateUrl: `${origin}/validate`, postUrl: `${origin}/post`,
      call: async (url, token, body) => {
        const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        return { status: response.status, body: await response.json() };
      },
    });
    const result = await runAutomaticSandbox(deps);
    assert.equal(result.outcome, 'sent');
    assert.equal(result.fbr_invoice_number, 'LOCAL-SANDBOX-1');
    assert.deepEqual(received.map(x => x.path), ['/validate', '/post']);
    assert.equal(received[0].authorization, 'Bearer local-test-token');
    assert.equal(received[1].payload.scenarioId, 'SN002');
    assert.equal(received[1].payload.buyerNTNCNIC, 'C012455');
    assert.deepEqual(payload, before);
    assert.deepEqual(records.map(x => [x[0], x[1]]), [['validate', 'valid'], ['submit', 'sent']]);
    await runAutomaticSandbox(deps);
    assert.equal(received.length, 2);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('concurrent production sends only claim and post one automatic Sandbox test', async () => {
  let posts = 0;
  const { deps } = setup({ call: async url => { if (url.endsWith('/post')) posts++; return { status: 200, body: { ...valid, invoiceNumber: 'LOCAL-SANDBOX-2' } }; } });
  const results = await Promise.all([runAutomaticSandbox(deps), runAutomaticSandbox(deps)]);
  assert.equal(posts, 1);
  assert.equal(results.filter(x => x.fbr_invoice_number === 'LOCAL-SANDBOX-2').length, 1);
});

test('rejected Sandbox validation never posts a test invoice or reports success', async () => {
  let calls = 0;
  const { deps, finishes } = setup({ call: async () => { calls++; return { status: 200, body: { validationResponse: { statusCode: '01', status: 'Invalid', errorCode: '0002', error: 'Invalid buyer registration' } } }; } });
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'failed');
  assert.equal(calls, 1);
  assert.equal(finishes[0].number, null);
});

test('valid reply without an FBR invoice number is unconfirmed and never posted twice', async () => {
  let calls = 0;
  const { deps } = setup({ call: async () => { calls++; return { status: 200, body: valid }; } });
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'pending_confirmation');
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'pending_confirmation');
  assert.equal(calls, 2);
});

test('missing Sandbox token performs no network calls and leaves production payload unchanged', async () => {
  let calls = 0;
  const before = structuredClone(payload);
  const { deps } = setup({ token: null, call: async () => { calls++; throw new Error('must not call'); } });
  assert.equal((await runAutomaticSandbox(deps)).outcome, 'skipped');
  assert.equal(calls, 0);
  assert.deepEqual(payload, before);
});

test('generated test items are separate objects from production items', () => {
  const copy = automaticSandboxPayload(payload);
  assert.ok(copy);
  copy.items[0].quantity = 999;
  assert.equal(payload.items[0].quantity, 1);
  assert.equal(copy.scenarioId, 'SN002');
});