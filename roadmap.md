# Updated code delivery
- [x] Remove mandatory sandbox prerequisites and add non-blocking automatic sandbox submission.
- [x] Correct seller/buyer NTN entry, normalization, and FBR error decoding; preserve C and all other NTN letters.
- [x] Allow referenced master-record deletion while preserving documents.
- [x] Run final regression tests and package complete updated source with upgrade instructions.
- [x] Verify automatic Sandbox flow with isolated HTTP test.
- [ ] Live buyer deletion and FBR acceptance verification — blocked by the unconnected self-hosted API/database and unavailable FBR tokens.

# v20
- [x] Fix "Expected string, received null" SRO error when editing saved records.
- [x] Add fixed/notified retail value on sales items when the Type of Goods requires it (3rd Schedule etc.) and send it to FBR.
- [x] Import all FBR HS codes and Custom HS codes from Sale_Sheet_Ammendment_13-09-2026.xlsx, keeping every description row; verify counts.
- [x] Check all Type of Goods entries for missing fields and add them.
- [x] Package updated ZIP.

# v20.3
- [x] Fix instant sign-out and explain FBR error 0052 using the supplied payload.
- [x] Fix repeated FBR rows and validation/submission concurrency protection.
- [x] Editable HS-based sale-type suggestions; part-name auto-fill superseded by v20.5 manual-entry requirement.
- [x] Test changes and deliver the original folder-layout ZIP.
- [ ] Confirm live database state and correct FBR classification — blocked by unavailable self-hosted connection and tokens.

# v20.5
- [x] Keep part name and part number manual; preserve linked searchable HS code/description dropdowns.
- [x] Test selection behaviour and package the original-layout updated ZIP.

# v20.7
- [x] Make HS description loading, custom mapping and validation suggestions compatible with mixed database collations.
- [x] Reproduce and test mixed-collation validation and document mapping; package the original-layout updated ZIP.
