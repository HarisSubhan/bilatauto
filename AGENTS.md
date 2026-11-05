<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The app UI talks to the self-hosted Node/MySQL API in server-package/ via src/lib/db.ts (VITE_API_URL); do not add Lovable Cloud or a second data layer — the owner chose to keep their own server.
- Master deletion uses deleted_at tombstones and hides rows from new selections while retaining relational identity for historical documents; never disable foreign keys or cascade financial records.
- Tax IDs retain their display format in storage; normalize only in FBR requests using matching frontend/server helpers so letters are never lost.
- Production token saving enables production directly; optional isolated automatic sandbox submissions never create financial documents or gate production, and ambiguous submissions retain duplicate protection.
- HS sale-type suggestions come from explicit custom HS master metadata, never code-prefix tax guesses; this avoids assigning an unsupported tax treatment.
- Shared LineItems and hsSelectionPatch link HS code and description only (plus explicit goods metadata), never part identity; keeping the linkage shared makes all document modules consistent.
- Validation state writes lock and preserve submitting, unconfirmed and accepted states; endpoint guards prevent a validation call from posting an invoice.
- FBR error suggestions use only explicit evidence (Custom HS master Type of Goods, previously FBR-accepted lines with the same HS code); never guess tax treatment from code digits.
- Cross-table HS comparisons and HS fallback expressions explicitly use utf8mb4_unicode_ci so older mixed-collation databases work without rewriting financial tables.
- Standalone database repairs must preserve unexpected stored tax columns, modify only verified generated expressions in place, and stop startup on failure to avoid serving partially repaired documents.
- Invoice print display is an explicit option passed through preview, print and PDF, independent of document kind; saved part identity never falls back to HS descriptions.
- Part Name-only sales reuse existing item fields, require FBR mapping only at the FBR boundary, and never create blank-HS stock movements; this preserves existing stock identity without adding a data layer.
- Shared frontend/server document rules enforce uniform service sales-tax rates on new saves, edits, imports and quotation approval without rewriting historical records.
