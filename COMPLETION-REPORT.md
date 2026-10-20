# Bilal Autos v9 — Completion report

## Implemented in the standalone React / Node.js / MySQL source
- Purchase and Sales templates retain uploaded headers/order; supplemental total/labor/goods/UOM columns are appended.
- Database-managed Type of Goods and UOM: supplied 28 goods and 29 UOM values, automatic serial, add/edit/verify, inactive state and referenced-value deletion protection.
- Purchase manual retail value and calculated Total Purchase Amount; sales VAT equals GST; per-line labor remains on discounted sales value before tax.
- Transactional grouped Excel import: continuation rows, business-name/NTN matching, master validation, calculated-value checks, duplicate detection, visible errors and no partial commit.
- Quotation Product Name stored and copied to invoices; customer view/PDF/export hides HS code and description.
- Invoice editing retains quotation link/numbers, resolves master IDs, preserves same-buyer snapshots, recalculates totals and reconciles stock.
- Plain-white A4 bills/sales-tax invoices without artwork, 40 mm top and 25 mm bottom margins, row pagination and stable item order. Quotations retain branding.
- Fresh `database/migration.sql` plus additive `database/upgrade-v9.sql`; no FBR submission or managed-cloud dependency in the standalone package.

## Observed checks passed (20 October 2026)
- Fresh MariaDB 11.4.8 migration and repeated application; alternative `db:init` setup.
- Frontend production build and strict TypeScript check.
- Seven backend calculation/grouping/precision regression tests.
- Actual browser XLSX uploads to Purchase/Sales; formatted Excel dates and uncached formula fields; continuation grouping; calculated totals read back from MySQL.
- Duplicate uploads display errors, leave one original invoice and no partial imports. Multiple invalid invoice groups return grouped row errors.
- Actual manual purchase UI save: quantity 3 × price 100, GST 18% => total 354; manual retail 999 persisted independently.
- Draft quotation edit, approval and paired invoice conversion; Product Name, buyer NTN, labor and item position carry over.
- Actual quotation-linked invoice UI edit: labor 16% => grand total 6,700; persisted and no duplicate stock-out.
- Referenced master deletion rejected; master add and historical snapshot behavior; invoice editing after master rename.
- Viewer role denied invoice edit and master creation; direct header-total bypass rejected.
- Single bill PDF, quotation PDF and 45-item multipage bill PDF downloaded. Every invoice page visually checked; headers/margins retained and all rows present. Print-window output contained all pages and no artwork.
- Desktop and 390-pixel mobile A4 preview; tested browser run had no runtime errors.
- Quotation spreadsheet export contains Product Name but no HS code/description columns.

## Not certified / limitations
- Tested on isolated MariaDB, not Oracle MySQL 8, the user's production database, cPanel or VPS. Back up and test deployment before replacing production.
- Physical printer output, real iOS/Android share sheets, every role combination and handwriting OCR accuracy were not verified.
- Existing bulk PDF path uses the same PDF routine but was not separately retested in v9.
- Existing stock verification/reversal logic outside invoice editing remains inherited; no full historical stock-audit certification.
- Imports report an error per failing invoice group (first failing row within that group), not every invalid cell.
- Inactive masters remain in historical records; select an active replacement to save an edited invoice.
- Large documents may place totals/signatures on a final summary page.
- These changes are in the independent standalone source; the live Cloud-backed preview was intentionally not replaced.

## Delivery status
Source staged cleanly without credentials, dependencies or generated build files. Updated Excel reference copies and this report are ready. Final ZIP awaits user approval following the full-flow checks. No FBR integration was started.

## v10 — FBR IRIS Digital Invoicing (added)
Built from PRAL "Technical Specification for DI API v1.12": Sandbox/Production settings with encrypted tokens and connection test, department/date/status filtered invoice list, local pre-checks, FBR validate → submit, plain-language error help (86 documented sales error codes), safe auto-fixes (scenario, UOM), history with exact request/response, duplicate-send protection, timeout = awaiting confirmation, Production lock until Sandbox success + Super Admin approval, sent invoices locked from edit/delete.

Tested (MariaDB 11.4): upgrade and fresh migration each applied twice; 18 automated checks; 29 end-to-end API checks against a simulated FBR server (validate, item error 0052, change-after-validation, send, no duplicate, separate Production state, edit/delete lock, viewer blocked, tokens never readable); a real call to gw.fbr.gov.pk with a fake token correctly reported "token rejected"; FBR screen checked in the browser.
Not tested: real Sandbox acceptance with your token (you run this first), timeout path against real FBR, Oracle MySQL 8 / cPanel.
Assumptions to confirm in Sandbox: value excl. ST is after discount; labor is not sent; further/extra tax, FED, withheld ST and SRO sent as 0/empty.
