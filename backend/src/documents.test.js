import { test } from "node:test";
import assert from "node:assert/strict";
import { dateSchema } from "./document-rules.js";

test("past, current and future dates are all accepted for documents", () => {
  for (const d of ["2020-01-15", "2024-12-31", "2026-10-20", "2030-06-01"]) assert.equal(dateSchema.parse(d), d);
});
test("impossible calendar dates are rejected", () => {
  assert.throws(() => dateSchema.parse("2026-02-30"));
  assert.throws(() => dateSchema.parse("20-01-2026"));
});
