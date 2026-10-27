# Standalone package architecture
- Keep the existing React/TanStack frontend and Node.js/Express/MySQL server; the hosted preview is separate so deployment never depends on Cloud credentials.
- Transactional create/import/edit operations share document-rules.js and documents.js; calculations and validation must not diverge between entry paths.
- Goods and UOM master IDs retain historical text snapshots; editing names changes future selection labels, not old documents.
- Invoice edits replace item-linked stock movements inside one transaction, keeping quotation links and exactly one stock deduction.
- Document numbering is allocated in the database transaction; imported invoice identifiers are preserved and advance matching INV counters.
- Customer quotation outputs whitelist Product Name and omit HS code/description; underlying HS data remains available for invoices.
- A4 output paginates between rows and repeats headers; each invoice page reserves physical-letterhead space.
- Full-detail print descriptions use a fixed-width single-line ellipsis without changing stored or FBR-submitted text.
- FBR connections are persisted per environment and mutually exclusive; only successful tests activate connections, and disconnect retains encrypted credentials and submission history. Buyer identity always comes from the invoice department, while seller identity comes from company settings.

- Standalone Sandbox forms submit isolated user-entered payloads only to validation, never creating stock or live invoices; seller identity is injected from persisted settings server-side. The scenario catalogue is seeded by migration and served from MySQL.
- Labor is represented only as item_kind='service' lines (manual amount = line value, quantity informational); legacy labor columns stay read-only for history. Services never create stock movements.
- FBR Final Invoices list only production rows with status 'sent' and an FBR invoice number; the printout adds QR (FBR number) and the DI logo, never for unsent invoices.

## Server notes
# Self-hosted server architecture
- This Node/Express/MySQL package runs separately from TanStack SSR; never import it into app runtime code.
- Master delete operations retain relational rows with deleted_at; default lists and new document entry exclude them, while financial history retains joins.
- Apply versioned database upgrades before running matching server code; db:init applies the baseline plus the latest upgrade for fresh installs.
- Persist display tax IDs unchanged and normalize separators only at the FBR boundary; never strip NTN letters.
- Production token saving connects Production directly without Sandbox approval; preserve permissions, local data validation, payload hashes and duplicate protection.
- Optional automatic Sandbox work uses a transactional singleton claim and isolated payload copy, records real FBR outcomes, never marks success without an FBR number, and never creates a local invoice or stock movement.- Sale-type field requirements live in goods-rules.js (mirrored in src/lib/goods-rules.ts); retail-price types tax sales lines on the stored retail value, matching the generated sales_tax_value column.
- Bulk HS code data ships as an idempotent staged upsert SQL file that refreshes descriptions without replacing existing row ids.

- HS sale-type suggestions use explicit custom HS master metadata, never tax guesses from prefixes.
- Shared LineItems and hsSelectionPatch link HS code and description only (plus explicit goods metadata), never part identity; keeping the linkage shared makes all document modules consistent.
- Validation updates preserve accepted/in-flight/unconfirmed states; invoice lists retain one row per invoice identity.
- The server adds missing upgrade columns at startup through schema-repair.js; live databases skipped upgrade files otherwise fail with Unknown column.
- Cross-table HS comparisons and HS fallback expressions explicitly use utf8mb4_unicode_ci so older mixed-collation databases work without rewriting financial tables.

- Standalone database repairs must preserve unexpected stored tax columns, modify only verified generated expressions in place, and stop startup on failure.
