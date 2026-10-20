# Standalone package architecture
- Keep the existing React/TanStack frontend and Node.js/Express/MySQL server; the hosted preview is separate so deployment never depends on Cloud credentials.
- Transactional create/import/edit operations share document-rules.js and documents.js; calculations and validation must not diverge between entry paths.
- Goods and UOM master IDs retain historical text snapshots; editing names changes future selection labels, not old documents.
- Invoice edits replace item-linked stock movements inside one transaction, keeping quotation links and exactly one stock deduction.
- Document numbering is allocated in the database transaction; imported invoice identifiers are preserved and advance matching INV counters.
- Customer quotation outputs whitelist Product Name and omit HS code/description; underlying HS data remains available for invoices.
- A4 output paginates between rows and repeats headers; each invoice page reserves physical-letterhead space.
- FBR connections are persisted per environment and mutually exclusive; only successful tests activate connections, and disconnect retains encrypted credentials and submission history. Buyer identity always comes from the invoice department, while seller identity comes from company settings.

- Standalone Sandbox forms submit isolated user-entered payloads only to validation, never creating stock or live invoices; seller identity is injected from persisted settings server-side. The scenario catalogue is seeded by migration and served from MySQL.
- Labor is represented only as item_kind='service' lines (manual amount = line value, quantity informational); legacy labor columns stay read-only for history. Services never create stock movements.
- FBR Final Invoices list only production rows with status 'sent' and an FBR invoice number; the printout adds QR (FBR number) and the DI logo, never for unsent invoices.
