import { SCENARIOS, interpret, assertValidationUrl } from './fbr.js';

/** An isolated copy of the selected invoice, not a local invoice or stock movement. */
export function automaticSandboxPayload(productionPayload) {
  const saleTypes = new Set(productionPayload.items.map(item => item.saleType));
  if (saleTypes.size !== 1) return null;
  const saleType = productionPayload.items[0]?.saleType;
  const scenario = saleType === SCENARIOS.SN001[1]
    ? productionPayload.buyerRegistrationType === 'Registered' ? 'SN001' : 'SN002'
    : Object.entries(SCENARIOS).find(([, [, type]]) => type === saleType)?.[0];
  if (!scenario) return null;
  return { ...productionPayload, scenarioId: scenario, items: productionPayload.items.map(item => ({ ...item })) };
}

/** Claim once before network I/O. Never retry an ambiguous post automatically. */
export async function runAutomaticSandbox({ payload, token, validateUrl, postUrl, claim, finish, call, record }) {
  if (!token) return { outcome: 'skipped', message: 'No Sandbox token saved; Production is unaffected.' };
  try { assertValidationUrl(validateUrl, postUrl); } catch (e) { return {outcome:'skipped',message:e.message}; }
  const testPayload = automaticSandboxPayload(payload);
  if (!testPayload) return { outcome: 'skipped', message: 'No single matching Sandbox scenario; Production is unaffected.' };
  const state = await claim();
  if (state !== 'claimed') return { outcome: state, message: state === 'sent' ? 'Automatic Sandbox already completed.' : 'Automatic Sandbox already attempted; see Sandbox history.' };
  try {
    const validation = await call(validateUrl, token, testPayload);
    const checked = interpret(validation.status ?? 503, validation.body);
    await record('validate', checked.outcome, validation, testPayload, checked);
    if (checked.outcome !== 'valid') {
      const message = checked.errors.map(e => e.problem).join('; ');
      await finish('failed', null, message);
      return { outcome: 'failed', message };
    }
    const sent = await call(postUrl, token, testPayload);
    const result = interpret(sent.status ?? 503, sent.body);
    const outcome = result.outcome === 'valid' && result.invoiceNumber ? 'sent' : result.outcome === 'invalid' || result.outcome === 'unauthorized' ? 'failed' : 'pending_confirmation';
    const message = outcome === 'sent' ? 'Automatic Sandbox accepted by FBR.' : result.errors.map(e => e.problem).join('; ') || 'Sandbox submission is unconfirmed; check FBR before retrying.';
    await record('submit', outcome, sent, testPayload, result);
    await finish(outcome, result.invoiceNumber ?? null, message);
    return { outcome, message, fbr_invoice_number: result.invoiceNumber ?? null };
  } catch {
    await finish('pending_confirmation', null, 'Automatic Sandbox was interrupted. Check Sandbox history before retrying.');
    return { outcome: 'pending_confirmation', message: 'Automatic Sandbox interrupted; Production is unaffected.' };
  }
}