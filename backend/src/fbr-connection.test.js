import { test } from "node:test";
import assert from "node:assert/strict";
import { connectionState, savingDisconnects } from "./fbr-connection.js";
test("connecting Production does not require or disconnect Sandbox", () => {
  assert.deepEqual(connectionState({ sandbox: true, production: false }, "production", true), { sandbox: true, production: true });
});
test("disconnecting Production leaves both disconnected", () => {
  assert.deepEqual(connectionState({ sandbox: false, production: true }, "production", false), { sandbox: false, production: false });
});
test("Sandbox can connect while Production remains connected", () => {
  assert.deepEqual(connectionState({ sandbox: false, production: true }, "sandbox", true), { sandbox: true, production: true });
});
const saved = { post_url: "https://gw.fbr.gov.pk/pdi/v1/validate", validate_url: "https://gw.fbr.gov.pk/pdi/v1/validate" };
test("re-saving identical Production settings keeps the connection", () => {
  assert.equal(savingDisconnects(saved, { post_url: saved.post_url, validate_url: saved.validate_url }), false);
});
test("changing a URL, adding or clearing a token requires re-testing", () => {
  assert.equal(savingDisconnects(saved, { post_url: "https://other.example.com", validate_url: saved.validate_url }), true);
  assert.equal(savingDisconnects(saved, { ...saved, token: "abc" }), true);
  assert.equal(savingDisconnects(saved, { ...saved, clear_token: true }), true);
});
