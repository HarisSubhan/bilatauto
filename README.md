# Bilal Autos — Spare Parts Management System

> **v9 upgrade:** Back up first. Existing v8 installations apply `database/upgrade-v9.sql`. Older v7 installations apply v8 then v9. Fresh installations use `database/migration.sql` only. Upgrades retain existing numbers/data; fresh invoice/STI numbering starts at 401 and quotation numbering at 481.


This package has three parts and does not depend on any hosted cloud service:

| Folder | What it is |
|---|---|
| `frontend/` | React app (TanStack Router, Tailwind). Builds to static files. |
| `backend/`  | Node.js + Express API. Handles login, all data, stock and approval rules. |
| `database/` | MySQL 8 / MariaDB 10.6+ schema (`schema.sql`) and full migration (`migration.sql`). |

## Requirements
- Node.js 20 or newer
- MySQL 8+ or MariaDB 10.6+

## 1. Create the database
```sql
CREATE DATABASE bilal_autos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bilal'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL ON bilal_autos.* TO 'bilal'@'localhost';
```
(On cPanel: MySQL Databases → create database + user → add user to database with ALL PRIVILEGES.)

Then import the migration file, which creates every table and seeds the default roles, permissions, settings and the Super Admin account:

```bash
mysql -u DBUSER -p bilal_autos < database/migration.sql
```

(On cPanel: phpMyAdmin → select the database → Import → choose `database/migration.sql`.)

Super Admin login after import: **bilalautos@gmail.com** / **123456789** — change this password after first login.

## 2. Backend
```bash
cd backend
cp .env.example .env      # fill in DB_*, JWT_SECRET, ADMIN_* values
npm install
npm run db:init           # creates tables, roles, permissions, settings and the Super Admin
```
`db:init` is safe to run again; it does not remove data.

## 3. Frontend
```bash
cd frontend
npm install
npm run build             # output: frontend/dist/client
```
Copy the contents of `frontend/dist/client` into `backend/public` (or set `PUBLIC_DIR` in `.env`).

## 4. Start
```bash
cd backend
npm start                 # http://localhost:4000
```
The backend serves both the app and the API from one address, so no extra web server setup is needed.
- VPS: run with `pm2 start src/server.js --name bilal-autos` behind Nginx/Apache.
- cPanel: Setup Node.js App → application root `backend`, startup file `src/server.js`, add the `.env` values as environment variables, then Run NPM Install.

## Default login
- Email: `bilalautos@gmail.com`
- Password: `123456789`

Change the password right after the first login (Users & Roles → reset password), and change `ADMIN_PASSWORD` in `.env`.

## Local development
Run the backend (`npm start`, port 4000) and in another terminal `cd frontend && npm run dev` (port 5173). The dev server forwards `/api` to the backend.
If the frontend is hosted on a different domain than the API, set `VITE_API_URL=https://api.example.com` before `npm run build` and add that frontend domain to `CORS_ORIGIN` in the backend `.env`.

## Business rules (enforced by the server/database)
- HS codes are the products (FBR and Custom lists). Each document line keeps the chosen description.
- Verified records cannot be deleted (MySQL triggers).
- Verifying a purchase adds Stock In; un-verifying removes it.
- Approving a quotation creates the invoice (same buyer, items, part numbers, prices) and Stock Out; shortfalls are recorded and stock never goes below zero.
- Current stock is always calculated from stock movements (`current_stock` view).
- Document numbers are allocated by the database inside the server transaction; imported sales identifiers are retained.
- Every change is written to the activity log.

## Import / export
Every module has Export. Suppliers, Buyers, FBR/Custom HS codes, Purchases, Quotations, Invoices and Inventory (opening stock) also have Template and Import with column matching.
Purchase and Sales templates preserve the uploaded column spelling/order. Additional columns are appended: Total Purchase Amount for purchases; Labor Percentage, Labor Value, Type of Goods and UOM for sales. Templates downloaded in-app contain dropdowns sourced from current active master records and calculation formulas. `templates/` contains initial blank reference copies; regenerate in-app after changing masters.

Purchase Invoice Number / Sales Invoice Number starts each group. Blank-number continuation rows inherit date, business name, NTN and vehicle number from that group. Each item row must supply its HS code, description, quantity, price, goods/UOM and manual retail value (purchase). Business name + NTN must match one active supplier/buyer. Imports validate all groups before committing: duplicate numbers, invalid masters/values, conflicting headers and provided totals that differ from calculated values reject the file without partial records. Sales imports create invoices directly, with an offline sales-tax pair and one stock-out—not draft quotations. Formula caches are validated if present; formulas without cached values are recalculated server-side. Use at most two decimal places.

Quotation import still groups by Ref and requires Product Name. Customer quotation export is deliberately not a re-import template because HS fields are hidden. New invoices are verified automatically, like the existing standalone flow; verify/unverify remains available.

## Key-free image quotation reader
Images are processed in your browser using Tesseract OCR; no Gemini/OpenAI key is required. The OCR engine/language assets download on first use, so initial internet access is needed. This is OCR, not a newly trained handwriting model. Handwriting may be inaccurate: correct the extracted text, match HS codes, review vehicle details, units, prices and tax, then tick the review checkbox before saving.

## Vehicle, taxes and both invoices
A vehicle type OR registration number is mandatory for each new quotation. Sales Tax Value is a separate calculated line column on quotations, bills and sales-tax invoices. There is no discount concept anywhere in the system; amounts are quantity × rate. Approval creates one regular invoice number and one sales-tax invoice number against the same invoice record; stock moves only once. Quotations retain the supplied letterhead. Regular and sales-tax invoices use plain-white A4 pages with 40 mm top / 25 mm bottom reserved for physical letterhead. Document pages repeat headers and break between item rows. Large totals can occupy a final summary page.

## Existing v3 installation upgrade
Back up your database first. Apply `database/upgrade-v4.sql` once, replace backend/frontend source, rebuild the frontend and restart the backend. Existing invoices keep their original numbers; the upgrade assigns offline STI numbers and copies vehicle fields where available. Old records without vehicle details must be completed before resubmission.

## Manual/offline FBR workflow (before v10)
Open Sales Tax Invoices, view and Print/PDF, then submit the generated document manually using your current process. No FBR submission occurs automatically today. FBR status stays offline; the submission API returns 501 until a certified integration is implemented. Future submission will use this same invoice record and sales-tax number.

## Verification
Isolated MariaDB API flow verified: purchase stock-in, approval creating INV + STI with one stock-out, per-line tax, labor totals, approval retry, required vehicle checks, invalid units and verified-deletion protection. Handwritten OCR accuracy, live FBR submission and all non-admin permission combinations are not certified.

## New v9 data and editing rules
- Type of Goods and Unit of Measurement: add/edit/verify, auto serial, active/inactive status. Unverify before deleting unused values; referenced values cannot be deleted. Deactivation removes choices from future entry but preserves saved transactions.
- Document lines store master IDs plus historical names, Product Name, stable line order and manual purchase Retail Sales Value. No separate product table and no editable stock totals.
- Purchase Value = quantity × unit cost (no discount concept anywhere in the system); Sales Tax Charged / Value Added Tax = rounded value × GST %. Total Purchase Amount = Purchase Value + Sales Tax Charged. Retail Sales Value is independent/manual.
- Service lines (e.g. labour) are entered as a line with item type Service: amount is the manually entered service amount, Service % is informational, and SST = amount × Service %; service lines never move stock.
- Draft quotations and all invoices can be edited. Invoice editing keeps its quotation link and numbers; recalculates totals and reconciles stock in one transaction. If old rows lack mandatory masters, complete those fields before saving. Inactive masters require an active replacement.
- `backend/src/document-rules.test.js`: run `node --test src/document-rules.test.js` from backend. See `COMPLETION-REPORT.md` for observed checks and limitations.

## v10 — FBR IRIS Digital Invoicing

Existing v9 database: back up, then run `mysql -u USER -p DBNAME < database/upgrade-v10-fbr.sql` (safe to run more than once).
New installs: `database/migration.sql` already includes v10. Add `FBR_SECRET_KEY` to `backend/.env` (see `.env.example`).

Menu → **FBR Invoicing**:
1. **Settings tab** — for Sandbox and Production separately: Post URL, Validate URL (prefilled from the PRAL DI API v1.12 document) and the security token PRAL issued. Tokens are encrypted in the database and never shown again. Press **Test connection** (calls FBR's province list; also loads FBR provinces and UOM names used by the local checks). Enter seller Name, CNIC, NTN, Address and Province in the seller settings form. NTN takes precedence when both NTN and CNIC are saved.
2. Edit each Department / Buyer: **Province** and **FBR registration** (Registered/Unregistered) plus Tax / Registration No.
3. **Invoices tab** — choose department, dates, status (Remaining, Not validated, Validation failed, Ready to send, Sent, Failed/Awaiting confirmation). Select invoices → **Validate selected** → fix any problems shown (plain language, where, how to fix; some have **Fix automatically**) → **Send to FBR**.
4. **History tab** — every test/validation/submission with exact request and FBR reply.

Rules: Sandbox and Production states are separate. Production stays locked until one invoice is sent successfully in Sandbox and the Super Admin approves it. Only validated invoices can be sent; if an invoice changes after validation it must be validated again. An invoice is never sent twice; a timeout is recorded as "Awaiting confirmation" (not failed, not sent) and can only be retried after you confirm FBR's portal has no record. Invoices sent to Production cannot be edited or deleted. Permissions: `fbr:view`, `fbr:validate`, `fbr:submit`, `fbr:configure` (Admin gets the first three).

Payload mapping (Sales Tax Invoice → DI API): HS code = mapped FBR HS code, description = FBR HS description, rate = GST %, value excl. ST = qty × price, sales tax = GST value, total = value + tax, sale type = Type of Goods, UOM = item UOM, scenarioId only in Sandbox. Labor is not a product line and is not sent — confirm with your tax advisor. Further tax, extra tax, FED, ST withheld and SRO fields are sent as 0/empty because the system does not record them yet; 3rd Schedule goods need a retail price which invoices don't store yet (flagged as manual action).

## v11 — Buyer details and connection controls
For an existing v10 installation, back up and apply `database/upgrade-v11-fbr-connections.sql`, replace the source, rebuild the frontend and restart the backend. Fresh `migration.sql` includes this change.
Buyer NTN/CNIC and province belong in Departments / Buyers and are read from the department selected on each invoice. Seller NTN and province identify your company, not the buyer.
Save credentials, then Connect / test. Production still requires Sandbox approval. Successful Production connection atomically disconnects Sandbox. Disconnect Production retains encrypted credentials and history, disables further validation/submission, and does not reconnect Sandbox automatically. Sandbox may be reconnected explicitly only after Production is disconnected. Changing API links or tokens disconnects that environment until tested again. Already-started network requests cannot be recalled by disconnecting.
Verification for this revision: 15 pure-logic checks passed, including buyer identity, mutual exclusion and disconnection; backend syntax checked. Hosted preview Department fields were saved and read back through Edit, and the temporary record was deleted. Real FBR connections, standalone database migration and standalone end-to-end API checks have NOT been run for v11. Hosted FBR controls remain read-only; enter tokens on your own server only.

## v12 — Seller identity and all 28 Sandbox scenarios
**Existing v10:** back up, apply `database/upgrade-v11-fbr-connections.sql` then `database/upgrade-v12-sandbox.sql`. **Existing v11:** apply only `database/upgrade-v12-sandbox.sql`. **Fresh install:** import `database/migration.sql`. Replace sources, rebuild the frontend and restart your Node.js server. Do not import the fresh migration into production as an upgrade.

FBR Invoicing → Settings: enter Seller Name, CNIC (13 digits), NTN (7 digits), Address and Province. At least NTN or CNIC is required; if both are entered the FBR sellerNTNCNIC field uses NTN. Existing company name/address and older CNIC settings are migrated without losing data. Buyer details remain separate in Departments.

FBR Invoicing → Sandbox test: select any of SN001–SN028, fill the invoice and buyer fields, add one or more item lines, then Validate Sandbox form. The selected scenario sets the sale type; enter your own PRAL-provided HS codes, rate, UOM and amounts. All API item fields are editable, including retail/fixed value, withholding, extra/further tax, FED and SRO fields. This isolated test form calls **validation only**, creates no real invoice or stock movement, and cannot send to Production. Successful API validations appear in History. Local checks run first. Test forms reset when leaving the tab.

The 28 scenario catalogue is seeded in MySQL from PRAL DI API v1.12 §9, p.46. Availability does not mean your token supports every scenario: choose those assigned to your business by PRAL. SN026–SN028 require retailer registration. The same scenario dropdown is available for existing invoice validation and default settings. Rates and special-sector values must follow your assigned scenario; the system does not invent certified sample tax data.

### v12 verification
- Fresh MariaDB 11.4 migration and repeat migration/upgrade succeeded.
- 25 backend tests passed; standalone frontend strict type checks and production build passed.
- Browser: signed in, saved all seller fields and reloaded, checked all 28 choices and SN028 sale-type selection, filled and validated SN001, and read its result back in History. Desktop and phone screens inspected, no browser errors.
- Isolated API test proved Production activates exclusively, Sandbox disconnects automatically, and Production disconnect retains encrypted credentials. Test forms created zero invoices and zero stock movements.
- **External FBR calls used an isolated response fixture, not the real FBR service.** No fixture or token is included in this package. Real FBR acceptance requires your own token, correct scenario data and network access; all 28 scenarios have not been certified against FBR. MySQL 8, cPanel and production hosting were not exercised in this revision.

## v13 — Labor removed, HS-code service lines, SRO / Buyer Type masters, FBR Final Invoices
**Existing v12:** back up, apply `database/upgrade-v13-services-sro.sql`, replace sources, run `npm install` in `frontend/` (adds `qrcode`), rebuild and restart. **Fresh install:** `database/migration.sql` already includes v13.

## v14 — purchase import and buyer NTN fixes

- Purchase/sales imports now accept unit rates with full precision (e.g. 135,309 / 33 = 4,100.272727...), G.S.T entered as an Excel percentage (0.18 or "18%" both mean 18%), and numeric HS codes.
- Registered buyers accept NTNs of 7-9 digits, so an NTN written with its check digit (e.g. 9012101-5) is valid for NADRA and other registered buyers, in both document saving and the FBR precheck.

**Existing v13:** back up, apply `database/upgrade-v14-import-precision.sql`, replace sources, rebuild the frontend and restart. **Fresh install:** `database/migration.sql` already includes v14.
- Labor is no longer a separate field. Add labour or any other charge as a **Service** line (own HS code, manual Service %, manual Service amount; Units/UOM optional, Units default to 1). Old invoices keep their earlier labor values for viewing/printing.
- Master Configuration: UOM, Type of Sales (Goods), SRO Master (95 values preloaded), Buyer Types (Registered / Unregistered).
- Invoices and quotations store a Buyer Type; a Registered buyer needs a 7/9-digit NTN or 13-digit CNIC.
- FBR payload sends service amounts once, `sroScheduleNo` / `sroItemSerialNo` from each line, and the invoice Buyer Type.
- **FBR Final Invoices**: lists invoices FBR accepted in Production and downloads them with the FBR invoice number, QR code (version 2, 1 x 1 inch) and FBR Digital Invoicing logo (DI API v1.12 section 6). FBR's API returns only the invoice number, not a file; the system prints the official layout from FBR's reply.

# Bilal Autos v19 — installation and changes

## Existing v18 installation
1. Back up your existing MySQL database and application files.
2. Keep your existing backend `.env` (database credentials, encryption/JWT secret and other settings). Do not replace it or change your encryption secret.
3. Import `database/upgrade-v19.sql` into the same existing database using phpMyAdmin. This is an additive upgrade, not a database replacement. Run it before restarting the new server.
4. Replace backend source with this package's `backend/` and install its dependencies using your existing installation procedure.
5. Replace frontend source with this package's `frontend/`, retain your existing API address settings, rebuild the frontend using its existing deployment procedure, and restart the Node server.
6. In FBR Settings, save your Production token. Saving it enables Production directly. No Sandbox invoice or Super Admin Sandbox approval is required.

Fresh installations: run the normal `backend` database initialization procedure; it now applies both the complete baseline migration and v19.

## NTN handling
- Seller and buyer NTN fields allow letters and dashes. Stored/displayed values remain unchanged.
- Letters are NEVER removed from FBR payloads. `C01245-5` becomes `C012455`, not `012455`.
- FBR's DI request uses the base registration without display separators: `7079463-0` becomes `7079463`. For a seven-character NTN followed by a dash/check digit, only the check digit is excluded. CNIC separators are removed, retaining all 13 digits.
- All seven-character alphanumeric NTNs are accepted locally, not just numbers or leading C.
- Corrected buyer tax numbers from Departments / Buyers override stale, corrupted invoice snapshots for FBR submissions. Financial snapshots remain stored.
- Invalid supplied buyer identities are caught for both Registered and Unregistered buyers; an unavailable identity can be blank only for an Unregistered buyer. FBR decides authorization and final validity.
- Quoted/double-encoded FBR responses are decoded into readable structured errors.

## Send to FBR
- The Send button validates the selected real invoices automatically, then sends the valid ones; no separate Validate click is required.
- If a Sandbox token is saved, the first eligible Production send also validates and posts an isolated copy of the selected invoice to Sandbox using a matching scenario, with no local invoice or stock changes.
- This needs a real Sandbox token; a Production token is never used for Sandbox. No token, no matching single scenario, or Sandbox rejection never blocks Production.
- Automatic Sandbox results appear with the Production result and in Sandbox history. A confirmed successful test is not repeated.
- Unconfirmed/interrupted Sandbox posts are not automatically retried, to avoid duplicates. Check FBR history first. A rejected test can be re-enabled by saving the Sandbox token again after correction.
- Sandbox and Production connections are independent; connecting Sandbox no longer disconnects Production.
- Normal permission checks, FBR field requirements, invoice-change detection and duplicate/ambiguous-post safeguards remain.

## Buyer and master deletion
- Delete removes the record from master lists and new-entry selections, including verified master records.
- The row is retained internally with `deleted_at`, so existing invoices, quotations, purchases, FBR records and stock history keep their buyer/supplier identity and links. No financial records cascade-delete and no foreign keys are disabled.
- Applies to buyers/departments, suppliers, FBR/custom HS codes, Type of Goods, UOM, SRO and Buyer Types.
- Historical FBR invoices can still be selected through the FBR buyer filter. Deleting a buyer does not delete any invoice.
- Verified financial document and submitted/unconfirmed Production invoice protections intentionally remain.

## Verification and limitations
Regression tests cover the uploaded seller/buyer IDs, alphabet preservation, FBR error decoding, all master-deletion paths and automatic Sandbox outcomes/duplicate protection.
Automatic creation and sending were also exercised through a local HTTP server: validate first, submit the generated isolated copy, save the returned test number, and prevent another submission. Additional tests cover simultaneous clicks, FBR rejection, a missing invoice number, and a missing Sandbox token. This is a simulated FBR service, not real FBR acceptance.
Run `node --test src/*.test.js` from `backend/` to repeat the 56 server tests. Frontend tax-ID tests also pass (5 tests).

### Confirm the real Sandbox test after installation
1. Apply the v19 upgrade and install this updated package on your existing server.
2. Save your actual Sandbox token under FBR Settings → Sandbox, and keep your Production token under Production. Do not share either token in chat.
3. Select Production and use Send to FBR for a genuine invoice you intend to submit. The first eligible send automatically prepares a separate Sandbox payload, validates it, and submits it to FBR Sandbox. It does not create a local financial invoice or stock movement.
4. Check the displayed Sandbox result and Sandbox history. Only an accepted submission with an FBR-issued invoice number counts as successful; also verify that number in IRIS. One accepted test does not prove every scenario required by your FBR account has been cleared.
5. If FBR explicitly rejects it, correct the reported fields and re-save the Sandbox token to re-enable the test. If the submission is unconfirmed or interrupted, do not blindly retry; check IRIS first. This package intentionally has no automatic reset for ambiguous or stuck claims.

No live self-hosted API/database or FBR token was connected in the editing environment. Live database upgrade, signed-in deletion and real FBR acceptance could not be verified here. Do not assume a successful local format check guarantees IRIS acceptance.
# Bilal Autos v20 — installation and changes

Install v19 first (see `UPDATE-v19.md`) if you have not already.

## Existing installation
1. Back up your MySQL database and application files.
2. Keep your existing backend `.env`.
3. In phpMyAdmin, import into the same database, in this order:
   1. `database/upgrade-v19.sql` (skip if already applied; rerunning is safe)
   2. `database/upgrade-v20.sql`
   3. `database/upgrade-v20-hs-codes.sql` (about 2.5 MB). At the end it shows a check table; both "sheet_rows" and "in_database" must read 7805 for FBR and 8603 for Custom.
4. Replace `backend/` source and the frontend source, rebuild the frontend as before, and restart the Node server.

Fresh installations: the normal database initialization applies the baseline, v19, v20 and the HS code list automatically.

## Editing saved records
Opening and saving an existing invoice or quotation whose items have no SRO, UOM or Type of Goods no longer shows "Expected string, received null".

## Fixed / Notified Value or Retail Price
- Sales invoice and quotation items show a "Fixed / Notified Value or Retail Price" box when the Type of Goods is "3rd Schedule Goods" (enter the total printed retail price for all units on the line).
- It is required on sales invoices of 3rd Schedule goods. Sales tax on that line is charged on the retail price, and FBR receives it as `fixedNotifiedValueOrRetailPrice`.
- The Excel sales import template has a new last column "Fixed / Notified Value or Retail Price".
- Purchases keep their own Retail Sales Value and tax on the purchase value, unchanged.

## Type of Goods checks
All 27 FBR sale types in the sheet's "FBR Master Refrence" already exist in Type of Goods (plus "Sugar").
Per type, the system now marks the extra FBR fields:
- 3rd Schedule Goods: Fixed / Notified Value or Retail Price.
- Goods at Reduced Rate, Goods at zero-rate, Exempt goods, Goods as per SRO.297(I)/2023, Non-Adjustable Supplies: SRO / Schedule and SRO item serial no. are required before sending to FBR.

## HS codes from Sale_Sheet_Ammendment_13-09-2026.xlsx
- FBR HS Codes: all 7805 codes from "FBR Codes Sheet" with their serial numbers and descriptions exactly as written.
- Custom HS Codes: all 8603 codes from "Customs HS Code" (7586 eight-digit codes and 1017 heading codes). Each description is the code's own row exactly as written, followed by every extra description row listed under it (1223 such rows, e.g. the (2)–(5) hose lists under 4009.3110).
- 39 bracketed deleted headings such as [05.03] have no description in the sheet and are not added. 5 codes with an empty description in the customs sheet (4008.2910, 8421.3110, 8544.4221, 8544.6020, 9401.2010) use their description from the FBR Codes Sheet.
- Existing codes keep their prices and links; only the description is refreshed. Rerunning does not create duplicates.

## Verification
Checked on a temporary MariaDB 11.4 database: fresh install, rerun of all upgrades, every one of the 9821 description rows found in its code, a 3rd Schedule invoice created and edited with empty SRO fields (tax 270 on retail 1500 at 18%), and a 3rd Schedule invoice without retail price blocked.
Run `node --test src/*.test.js` in `backend/` (62 tests). Real FBR acceptance of 3rd Schedule lines has not been verified.


# v20.3 update — validation, HS suggestions and instant sign-out

## Install on your current v20/v20.2 installation
1. Back up the database and files. Keep your existing backend .env and frontend API configuration.
2. Import database/upgrade-v20.3.sql into the same database. Older upgrades still apply if upgrading from v18/v19.
3. Replace backend source and frontend source, rebuild your frontend using your existing process, and restart the Node backend. No server-package directory is included in this download.

## Error 0052 in your supplied invoice
FBR rejected the HS-code/sale-type pairing, not an empty SRO field. Its header-level reply does not identify the failing line. The supplied 9820.2000 description covers industrial/special machinery workshops; this does not establish that it is the correct code for automotive labour. Verify the actual goods and services classification and rate with current FBR/PRAL reference data or your tax adviser. Do not substitute an HS code, SRO serial or tax rate solely to obtain acceptance. Earlier advice to try ICTO TABLE I / 001 was not a verified classification and should not be relied upon.
Official specification: https://download1.fbr.gov.pk/Docs/20257301172130815TechnicalDocumentationforDIAPIV1.12.pdf
Reference GET methods include /pdi/v1/itemdesccode, /pdi/v2/HS_UOM?hs_code=...&annexure_id=..., and /pdi/v2/SaleTypeToRate?date=...&transTypeId=...&originationSupplier=.... The rate method is not a complete HS/sale-type compatibility mapping.

## One invoice, multiple validation history entries
Validation only calls the validation endpoint and updates the single invoice state. It never creates a local invoice or performs submission. Repeated validation history entries are intentional audit history, not duplicate invoices. The invoice table displays one row per invoice ID. The database upgrade verifies a unique invoice/environment state key; if duplicate states already exist, it stops without deleting accepted numbers or financial records. Such existing states require reconciliation after backup.
Validation cannot reset sent, submitting or unconfirmed states; active sends cannot be retried concurrently. Connection failures after a send are treated as unconfirmed: check IRIS before explicitly retrying.
Check FBR Settings: Production Validate URL must be https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata and Post URL https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata. Sandbox uses the corresponding _sb endpoints. Validation is blocked if configured with a post endpoint.

## Part names and Type of Goods
Part names and part numbers are entered manually and never filled or replaced by HS selection or description typing. Selecting an HS code fills its exact HS description; selecting an HS description fills its code. Both fields keep their searchable dropdowns (for example, typing 87 lists matching codes). Existing saved and submitted invoices are not rewritten.
In Custom HS Codes, edit Suggested Type of Goods after confirming its classification. Selecting that code then auto-selects this suggestion on invoices, quotations and purchases; the line selector remains editable. No guessed classifications are bulk-assigned: an unmapped code clears the previous code's sale type so you must select the correct type. The spreadsheet supplied previously contains no verified per-code sale-type mapping.

## Instant sign-out
Sign out clears the session, account details and cached private queries, and immediately opens the login screen. No page refresh is required.

## Verification and limits
66 server checks and 17 focused frontend checks passed. The actual validation handler was exercised with an isolated database/FBR simulation: three validations updated one invoice state, each duplicate ID was processed once, no post endpoint or financial invoice insert occurred, and an unconfirmed invoice was not revalidated. Sign-in/menu sign-out was exercised in Chromium against a simulated API and immediately returned to /auth with token removed. These are local checks, not verification on your hosted database or real FBR. Live duplicate-state reconciliation, the new migration on your hosted database, HS classification and FBR acceptance remain unverified because no hosted API/database or FBR token is connected here.
Repeat checks: node --test src/*.test.js from backend; bunx vitest run src/lib/auth.test.tsx src/lib/document-calculations.test.ts src/lib/tax-id.test.ts from frontend after installing test dependencies.

## UPDATE v20.4 — Suggested fixes for FBR validation errors
- When validation fails, each error now shows a **System suggestion** (item, current value → suggested value, and why).
- Suggestions only use explicit evidence: the Type of Goods set in Custom HS Codes, and earlier invoice lines with the same FBR HS code that FBR accepted (with their SRO / serial no. / UOM). Nothing is guessed from HS code digits.
- Buttons: **Apply**, **Apply & validate again**, **Edit invoice** (opens the invoice edit form directly) and **Validate again**.
- Applying a suggestion records an activity log entry and never changes a sent or in-progress invoice.
- No database upgrade is needed.

## UPDATE v20.5 — Manual parts and linked HS dropdowns
- Part Name and Part Number remain manual in invoices, quotations and purchases, including when changing the HS code or typing a description.
- HS code and HS description remain linked searchable dropdowns using the existing Custom HS master. Selecting either fills the other, retaining the full description.
- Dropdown results display code and description, and outdated search responses cannot replace the current results.
- Existing Type of Goods suggestions, FBR validation protections, backend, database and templates are unchanged. No database upgrade is needed from v20.4; replace the frontend source and rebuild using your existing deployment process.
- All 23 frontend tests passed, including selection in both directions, typing 87, and preserving manual part identity. Your hosted API/master records were not available here, so live server behaviour remains unverified.

## UPDATE v20.7 — Mixed-collation validation error
- Fixes the reported `Illegal mix of collations (utf8mb4_general_ci,IMPLICIT) and (utf8mb4_unicode_ci,IMPLICIT) for operation '='` in HS description loading, custom-to-FBR mapping and HS fallback expressions for validation suggestions.
- This is a database comparison error, not an FBR classification rejection. The queries now compare HS text with explicit compatible settings; no existing table collation or stored invoice data is changed.
- Installation: back up files/database, replace the backend source from this download, keep your existing backend `.env` and encryption secret, and restart the Node application. No new SQL import or frontend rebuild is required for this correction. The v20.6 automatic missing-column repair is retained.
- Verified with an isolated MariaDB database containing the exact two reported collations: the original comparison fails, custom/direct mappings work after the fix, and the real validation handler returns valid against a simulated FBR reply without posting an invoice or changing manual part names/numbers. 33 related regression tests also passed.
- Your live database and real FBR acceptance remain unverified. To repeat the integration test, create a disposable `collation_test` database with a local root account and run `COLLATION_TEST_PORT=<test-port> node --test src/fbr-collation.test.js` from backend. Never point tests at production.


## UPDATE v20.8 — Compatibility audit and safer startup
- Preserves the v20.7 screens, workflows, calculations, manual part identity and original root folder layout. No new table, new field, or table-collation conversion is introduced by this update. Existing v20.6 missing-field compatibility repair remains; it is not a replacement for earlier ordered migrations.
- The server now refuses to start if compatibility repair fails, instead of exposing incomplete database state to invoice, purchase or quotation requests. Review the logged error before restarting; do not replace or recreate your live database.
- Retail-tax repair never drops a tax column. It verifies that sales_tax_value is generated before modifying the known calculation in place; unexpected manually stored values are preserved and startup stops. Interrupted retail upgrades are also detected even when retail_sales_value already exists.
- Deployment: back up files/database, replace backend/src from this package, retain your existing .env and encryption key, and restart the Node backend. No frontend rebuild or new SQL import is required for v20.7 to v20.8.
- Local checks: 74 backend tests and 23 frontend tests passed, plus the opt-in mixed-collation test against MariaDB 11.4 and a disposable original baseline database exercising login/account, all eight master create/edit/delete/list paths, purchase stock-in, quotation create/edit/approve, invoice edit with null SRO, manual parts, stock reconciliation, report source reads, settings and referenced buyer deletion retaining history. Repair was run twice to confirm repeatability. Failed repair was verified to exit without listening.
- Limits: these are isolated API/database checks, not every hosted UI workflow. Report source reads are not verification of every printed report. Sign-out UI was checked with a simulated API. Purchases retain the original no-edit workflow. No real FBR invoice was posted. Your production MySQL/schema, all hosted screens, classification and FBR acceptance remain unverified because the self-hosted connection and tokens are unavailable.
