Final System Modifications Before FBR Integration — Purchase, Sales, Master Configuration, Quotations & Invoices

1. Important Instructions

Before starting any development, carefully inspect the existing application, database structure, Purchase module, Sales/Invoice module, Quotation module, existing Excel import/export functionality, calculations, and invoice generation logic.

These are the final modifications required before connecting the application to FBR.

Important rules:

- Modify only the modules, forms, templates, calculations, and document layouts specified below.
- Preserve all existing functionality, business rules, permissions, database relationships, and UI behavior unless a change is explicitly required.
- Do not rebuild the application or unnecessarily change its architecture.
- Do not introduce hardcoded sample data or duplicate modules.
- Reuse the existing database and application logic wherever possible.
- Do not start FBR integration during this phase.
- All changes must work with the actual database, not just the frontend UI.

I will provide the following inputs separately:

1. The existing/new required Purchase Excel template.
2. The existing/new required Sales Excel template.
3. The complete list of Type of Goods values.
4. The complete list of Unit of Measurement (UOM) values.
5. The existing Bilal Arts letterhead reference, if needed for understanding the current document layout.

Use the uploaded Excel files as the source of truth for the required columns and their order.

2. Purchase Module — Excel Template and Manual Entry Form

A. Purchase Excel Template

Update the Purchase Excel template to match the Purchase Excel sheet I will upload.

- Include all required columns from the provided sheet.
- Preserve the exact column names and column order.
- Do not omit any required field.
- Ensure the template is suitable for importing actual purchase records.
- Add dropdown validation for Type of Goods and UOM wherever applicable.
- The dropdowns must use values maintained in Master Configuration.
- Apply automatic calculations wherever the existing business rules require them.
- Keep invoice-level information separate from product-level information logically, even when both are imported from the same Excel sheet.

B. Purchase Manual Add Form

Update the existing Add Purchase / Add Manual Record form.

Every required field represented in the Purchase Excel template must also be available in the manual entry form.

Requirements:

- All mandatory fields must have proper validation.
- Type of Goods must use a dropdown populated from Master Configuration.
- UOM must use a dropdown populated from Master Configuration.
- HS Code, product description, quantity, unit price, and other fields must follow the provided Excel structure and existing business rules.
- Use automatic HS Code description fetching if this functionality already exists or can be correctly implemented through the application's existing data source.
- Do not invent HS Code descriptions or silently use incorrect descriptions when a lookup fails.
- Preserve existing purchase calculations and validations unless explicitly modified by these requirements.

Both Excel import and manual entry must save data consistently to the same underlying purchase records.

3. Purchase Excel Import — Multiple HS Codes Under One Invoice

Implement proper invoice grouping when importing purchase records from Excel.

Required grouping rule

The Purchase Invoice Number will be the unique identifier for each purchase invoice.

Example:

Purchase Invoice No.| HS Code| Type of Goods| Description| UOM| Quantity| Unit Price
PI-1001| 1001.0000| Goods A| Description A| KG| 100| 50
Empty| 1002.0000| Goods B| Description B| PCS| 20| 150
Empty| 1003.0000| Goods C| Description C| BOX| 10| 200
PI-1002| 1004.0000| Goods D| Description D| KG| 50| 75
Empty| 1005.0000| Goods E| Description E| PCS| 15| 100

The values above are illustrative only. Actual columns and valid values must follow the Excel file I provide.

Required behavior

- When a new Purchase Invoice Number appears, create a new purchase invoice.
- All subsequent rows with a blank Purchase Invoice Number belong to the most recent invoice number above them.
- Each row containing product-level details represents another line item under that same invoice.
- When a different Purchase Invoice Number appears, start a new purchase invoice group.
- Blank invoice-level fields in continuation rows must inherit the appropriate invoice context; they must not create separate purchases.
- Do not create a new purchase invoice for every row containing an HS Code.
- Save every HS Code line item under its correct parent purchase invoice.
- Preserve all product-level details and their corresponding quantities, units, and prices.

Import validations

Before saving:

- Validate invoice numbers and required invoice-level fields.
- Validate required product-level fields for every populated product row.
- Validate Type of Goods and UOM against configured values.
- Detect invalid rows, missing required information, and inconsistent invoice-level data.
- Display clear row-level errors so the user can correct the Excel file.
- Avoid duplicate purchases when the same invoice is imported again. Use an appropriate duplicate check based on the existing data model.
- Prevent partial or inconsistent imports. Use a transaction or equivalent safe import process where appropriate.
- Show a summary of successful records, rejected rows, and validation errors.

Support blank invoice-number continuation rows without requiring the user to repeat invoice-level data.

4. Sales Module — Excel Template and Invoice Grouping

Apply the same Excel import and invoice-grouping mechanism to the Sales module.

A. Sales Excel Template

Use the Sales Excel sheet I will upload as the source of truth.

- Preserve its exact column names and order.
- Include every required field.
- Add the additional Labor Percentage and Labor Value columns described below.
- Preserve existing Sales calculations and business rules.
- Apply dropdown validation for Type of Goods and UOM where applicable.
- Ensure the template can be imported directly into the existing Sales module.

B. Sales Invoice Grouping

Use the Sales Invoice Number as the unique invoice identifier.

- The first row of an invoice contains the invoice number and relevant invoice-level details.
- Subsequent rows with a blank Sales Invoice Number belong to that same invoice.
- Each subsequent row can contain a different HS Code and its associated product details.
- A new Sales Invoice Number starts a new sales invoice.
- All product lines must be saved under the correct invoice.
- Do not create separate invoices for continuation rows.
- Apply the same validation, duplicate detection, error reporting, and safe import rules specified for Purchase.

Purchase and Sales must use consistent grouping behavior while maintaining their separate business logic.

5. Master Configuration Module

Add a new sidebar module named Master Configuration.

Inside this module, provide two submenu items:

1. Type of Goods
2. Unit of Measurement (UOM)

A. Type of Goods Management

Create a management screen for Type of Goods with the following columns:

- Serial Number
- Type of Goods

Provide the following actions:

- Add new record
- Edit existing record
- Delete record, subject to dependency checks
- Verify or approve records using the application's existing verification/authorization conventions, where applicable

B. Unit of Measurement Management

Create a management screen for UOM with the following columns:

- Serial Number
- Unit of Measurement

Provide the same Add, Edit, Delete, and Verify actions.

C. Master Configuration Rules

- I will provide the complete Type of Goods list.
- I will provide the complete UOM list.
- Load these values into the relevant master tables and make them available throughout the application.
- Use database-backed records, not hardcoded dropdown options.
- New values added in Master Configuration must automatically become available in the Purchase form, Sales form, and their respective Excel templates/import validation.
- Editing a master value must update its available display value consistently without corrupting historical transactions.
- Prevent deleting master records that are already referenced by transactions, or provide a safe deactivation mechanism.
- Ensure serial numbers are generated consistently and are not treated as the business identifier unless the existing architecture requires it.

6. Dynamic Dropdowns in Forms and Excel Templates

Type of Goods and UOM must be available as dropdowns in:

- Purchase Manual Add Record form
- Purchase Excel template
- Sales Manual Add Record form
- Sales Excel template
- Any relevant line-item editing forms

The dropdown options must be synchronized with the database records maintained in Master Configuration.

For Excel imports, validate the uploaded values against the configured master records. Do not silently accept invalid or misspelled values.

If Excel dropdown validation is technically supported by the existing spreadsheet generation library, implement it directly in the generated template. Also retain server-side validation during import because Excel dropdown validation alone is not sufficient.

7. Purchase and Sales Calculations

Preserve the existing calculation rules.

Purchase

The following values must continue to calculate automatically wherever the existing system defines them as calculated fields:

- Purchase Value
- Applicable Sales Tax Charge
- Any existing dependent totals or calculated values

Sales

Preserve the existing automatic calculations for:

- Purchase Value, where applicable
- Sales Tax Charge
- Retail Sales Value
- Other existing calculated fields and totals

Do not convert automatically calculated fields into manually editable fields unless explicitly required.

Ensure that calculations work consistently across:

- Excel import
- Manual entry
- Editing existing records
- Invoice viewing
- Invoice downloading
- Database persistence

Use the existing calculation formulas as the source of truth. If a formula is missing or inconsistent, identify it before changing the logic.

8. Labor Percentage and Labor Value in Sales

Add two additional columns to the Sales template and corresponding Sales record-entry/editing functionality:

1. Labor Percentage
2. Labor Value

These are two separate fields. Do not create a Labor GST Percentage field as a substitute.

Required behavior

- Every HS Code line item must have its own applicable Labor Percentage and calculated Labor Value.
- The user enters the Labor Percentage.
- The system automatically calculates the corresponding Labor Value using the existing business rule.
- Labor Value must be calculated independently for each HS Code line item.
- The calculation must update when the percentage or its applicable calculation base changes.
- The calculated value must be stored and displayed consistently wherever required by the existing system.
- On editing a record, the system must correctly recalculate the Labor Value when appropriate.
- Excel imports must support the Labor Percentage field and correctly calculate Labor Value.
- Prevent users from accidentally overriding calculated Labor Value unless the existing business rules explicitly permit it.

Important: Inspect the current labor calculation logic and preserve its existing rule. Do not assume that Labor Value is calculated on the same base as Sales Tax or Purchase Value without verifying the existing implementation. If the calculation base is not defined anywhere, flag it for confirmation instead of inventing a formula.

9. Quotation Module — Product Name Field

Add a new field named Product Name to the quotation creation and editing workflow.

Required behavior

- The user must be able to enter a product name manually.
- Product Name must be stored with the quotation item and remain available when the quotation is reopened or edited.
- When a quotation is converted into an invoice, carry the Product Name forward where applicable.
- Preserve the existing quotation workflow and all other quotation rules.

Quotation View and Download

For quotation previews and downloaded/printed quotation documents:

- Display Product Name.
- Hide HS Code completely.
- Hide the HS Code Description completely.
- Do not show these hidden fields in the quotation's visible product table or printable document.
- Apply the same visibility rules to both View Quotation and Download Quotation.
- Ensure the hidden information does not appear in alternate quotation print layouts or exported quotation documents.

These are presentation requirements. Preserve any underlying data needed for subsequent invoice generation and FBR submission.

The Product Name entered by the user should be the product description shown to the customer in the quotation.

10. Invoice Generation From Quotations

When a quotation is converted into an invoice:

- Preserve the existing quotation-to-invoice workflow.
- Carry forward all available quotation information.
- Keep HS Code and HS Code Description available for the invoice where required.
- Make the resulting invoice editable through the existing invoice-editing functionality.
- Allow the user to manually enter or update invoice fields that were not present in the original quotation.
- Include the fields required by the updated invoice structure, including applicable HS Code details, Type of Goods, UOM, quantities, prices, Labor Percentage, Labor Value, and other required invoice fields.
- Use the correct dropdowns for Type of Goods and UOM.
- Recalculate dependent values according to the existing business rules whenever relevant input values change.
- Preserve the original quotation record and maintain the relationship between the quotation and the generated invoice.

Do not force users to recreate an invoice from scratch simply because the quotation does not contain every field required by the invoice.

11. Invoice View, Download and Print — Plain White Page

The existing quotation/invoice documents currently use the Bilal Arts letterhead design.

Change the invoice output behavior so that the invoice is generated on a plain white page without the letterhead, header artwork, or footer artwork.

Apply this requirement to:

- View Invoice
- Download Invoice
- Printable invoice output

Layout requirements

- Remove the embedded letterhead artwork, header graphics, and footer graphics from invoice output.
- Do not remove essential invoice information such as invoice number, dates, customer details, item details, totals, taxes, or other required fields.
- Use a clean, professional invoice layout on a white background.
- Leave sufficient blank space at the top for the existing physical letterhead's header.
- Leave sufficient blank space at the bottom for the physical letterhead's footer.
- Position the invoice content in the usable middle area of the page so that it can be printed onto the existing Bilal Arts letterhead without overlapping its preprinted header or footer.
- Preserve readable typography, alignment, page margins, tables, and totals.
- Support multipage invoices while maintaining the intended margins and readable layout.

The application must not print the letterhead itself. The user will print the generated invoice onto the physical letterhead separately.

Apply the layout change only to the specified invoice output. Do not unnecessarily modify unrelated documents or other modules.

12. Invoice Data Integrity and FBR Readiness

Although FBR integration is not part of this phase, the updated Purchase, Sales, and Invoice records must remain structured and consistent for the future integration.

- Preserve HS Codes and the corresponding descriptions in the underlying transaction records.
- Preserve invoice-level and item-level relationships.
- Keep Type of Goods, UOM, quantities, prices, tax values, labor values, and other relevant fields correctly associated with each item.
- Ensure manual entries and Excel-imported records follow the same validation rules.
- Do not remove or hide required transactional data from the database merely because it is hidden in a quotation preview.
- Do not implement FBR API calls, credentials, live submission, or FBR integration changes in this phase.

The future FBR integration must be a separate phase after the present modifications have been completed and verified.

13. Database and Backend Requirements

Inspect the current database schema before making changes.

- Add or modify database fields and relationships only where necessary.
- Ensure every new field is saved correctly and remains available after refreshing or reopening a record.
- Use appropriate database migrations and preserve existing transaction data.
- Handle existing records that do not yet contain the newly introduced fields.
- Ensure import and manual-entry paths use the same backend validation and calculation rules.
- Implement safe transactions for multi-item invoice creation and Excel imports.
- Prevent duplicate invoices and orphaned item records.
- Preserve audit trails and existing verification permissions wherever the application already supports them.
- Apply appropriate authorization checks to Master Configuration and transactional edits.

Do not implement frontend-only changes that appear to work but fail to persist in the database.

14. Testing and Acceptance Criteria

Before declaring the work complete, test all the following scenarios.

Purchase

- Import the provided Purchase Excel template.
- Create a purchase manually using the updated form.
- Import an invoice containing multiple HS Codes, with the invoice number entered only on the first row.
- Confirm all continuation rows belong to the correct purchase invoice.
- Confirm a new invoice number creates a separate purchase.
- Confirm Type of Goods and UOM dropdowns use Master Configuration values.
- Confirm required-field validation and automatic calculations work.

Sales

- Import the provided Sales Excel template.
- Create and edit sales records manually.
- Import a sales invoice containing multiple HS Codes under a single invoice number.
- Confirm the correct invoice grouping.
- Verify Labor Percentage and Labor Value for each line item.
- Verify existing Purchase Value, Sales Tax Charge, and Retail Sales Value calculations.

Master Configuration

- Add, edit, verify, and safely delete or deactivate Type of Goods and UOM records.
- Confirm new master records appear in the relevant forms and Excel templates.
- Confirm invalid dropdown values are rejected during import.

Quotations and Invoices

- Create a quotation with a manually entered Product Name.
- Verify that quotation previews and downloads show Product Name but hide HS Code and HS Code Description.
- Convert the quotation into an invoice.
- Edit the resulting invoice and manually complete any missing fields.
- Verify HS Code information remains available in the invoice.
- Download and print the invoice on a plain white page with adequate top and bottom space for the physical letterhead.

Regression Testing

- Confirm existing modules and unrelated features still work.
- Confirm old transaction records remain accessible.
- Confirm no duplicate invoice records are created by the import workflow.
- Confirm there are no new console errors, backend errors, or database failures.

15. Final Delivery Requirements

After implementation, provide a concise completion report stating:

1. Which modules and forms were modified.
2. Which database changes and migrations were made.
3. Which Purchase and Sales Excel columns were implemented.
4. How multi-HS-Code invoice grouping works.
5. How Type of Goods and UOM are managed and synchronized.
6. Which calculations were preserved or updated.
7. How Product Name and quotation field visibility work.
8. How the plain-white invoice print layout works.
9. Which