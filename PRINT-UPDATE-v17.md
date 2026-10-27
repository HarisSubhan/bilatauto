# v17 — Print corrections

- All four layouts now reserve 180 CSS pixels (47.6 mm) at the top, up from 150 pixels, plus a 32-pixel gap below buyer/document/seller details.
- Full-detail sales-tax descriptions stay on one line with an ellipsis. Extra part/master/SRO sub-lines are removed from that printed description cell; saved data and FBR payloads are unchanged.
- “Deliver to gate 2” was invented sample text, not a required delivery instruction. Updated examples use empty notes. No database notes are deleted or globally hidden.
- No changes to amounts, taxes, stock, templates, or FBR submission logic.
- This update applies to the standalone Node.js/MySQL delivery, not the separate hosted preview.