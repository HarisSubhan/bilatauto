import { test } from "node:test";
import assert from "node:assert/strict";
import { connectionState } from "./fbr-connection.js";
test("connecting Production automatically disconnects Sandbox", () => {
  assert.deepEqual(connectionState({ sandbox: true, production: false }, "production", true), { sandbox: false, production: true });
});
test("disconnecting Production leaves both disconnected", () => {
  assert.deepEqual(connectionState({ sandbox: false, production: true }, "production", false), { sandbox: false, production: false });
});
test("Sandbox cannot reconnect while Production is connected", () => {
  assert.throws(() => connectionState({ sandbox: false, production: true }, "sandbox", true), /Disconnect Production/);
});