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
A vehicle type OR registration number is mandatory for each new quotation. Sales Tax Value is a separate calculated line column on quotations, bills and sales-tax invoices. Labor/service percentage applies to the discounted subtotal before sales tax. Approval creates one regular invoice number and one sales-tax invoice number against the same invoice record; stock moves only once. Quotations retain the supplied letterhead. Regular and sales-tax invoices use plain-white A4 pages with 40 mm top / 25 mm bottom reserved for physical letterhead. Document pages repeat headers and break between item rows. Large totals can occupy a final summary page.

## Existing v3 installation upgrade
Back up your database first. Apply `database/upgrade-v4.sql` once, replace backend/frontend source, rebuild the frontend and restart the backend. Existing invoices keep their original numbers; the upgrade assigns offline STI numbers and copies vehicle fields where available. Old records without vehicle details must be completed before resubmission.

## Manual/offline FBR workflow (before v10)
Open Sales Tax Invoices, view and Print/PDF, then submit the generated document manually using your current process. No FBR submission occurs automatically today. FBR status stays offline; the submission API returns 501 until a certified integration is implemented. Future submission will use this same invoice record and sales-tax number.

## Verification
Isolated MariaDB API flow verified: purchase stock-in, approval creating INV + STI with one stock-out, per-line tax, labor totals, approval retry, required vehicle checks, invalid units and verified-deletion protection. Handwritten OCR accuracy, live FBR submission and all non-admin permission combinations are not certified.

## New v9 data and editing rules
- Type of Goods and Unit of Measurement: add/edit/verify, auto serial, active/inactive status. Unverify before deleting unused values; referenced values cannot be deleted. Deactivation removes choices from future entry but preserves saved transactions.
- Document lines store master IDs plus historical names, Product Name, stable line order and manual purchase Retail Sales Value. No separate product table and no editable stock totals.
- Purchase Value = quantity × unit cost − discount; Sales Tax Charged / Value Added Tax = rounded value × GST %. Total Purchase Amount = Purchase Value + Sales Tax Charged. Retail Sales Value is independent/manual.
- Labor Value = discounted sales value × line labor percentage. Line total includes GST but excludes labor; document grand total adds labor.
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

Payload mapping (Sales Tax Invoice → DI API): HS code = mapped FBR HS code, description = FBR HS description, rate = GST %, value excl. ST = qty × price − discount, sales tax = GST value, total = value + tax, sale type = Type of Goods, UOM = item UOM, scenarioId only in Sandbox. Labor is not a product line and is not sent — confirm with your tax advisor. Further tax, extra tax, FED, ST withheld and SRO fields are sent as 0/empty because the system does not record them yet; 3rd Schedule goods need a retail price which invoices don't store yet (flagged as manual action).

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
- Labor is no longer a separate field. Add labour or any other charge as a **Service** line (own HS code, manual Service %, manual Service amount; Units/UOM optional, Units default to 1). Old invoices keep their earlier labor values for viewing/printing.
- Master Configuration: UOM, Type of Sales (Goods), SRO Master (95 values preloaded), Buyer Types (Registered / Unregistered).
- Invoices and quotations store a Buyer Type; a Registered buyer needs a 7/9-digit NTN or 13-digit CNIC.
- FBR payload sends service amounts once, `sroScheduleNo` / `sroItemSerialNo` from each line, and the invoice Buyer Type.
- **FBR Final Invoices**: lists invoices FBR accepted in Production and downloads them with the FBR invoice number, QR code (version 2, 1 x 1 inch) and FBR Digital Invoicing logo (DI API v1.12 section 6). FBR's API returns only the invoice number, not a file; the system prints the official layout from FBR's reply.
