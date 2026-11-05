-- v14: purchase/sales import fixes
-- 1) Unit rates from divided totals (e.g. 135,309 / 33 = 4,100.272727...) need more than
--    2 decimals, otherwise the stored rate no longer matches the sheet and the generated
--    Sales Tax Value drifts by paisas. Widen rate columns to 6 decimals and units to 4.
-- 2) Safe to run on an existing database: only column precision is widened, no data is lost.

ALTER TABLE invoice_items DROP COLUMN IF EXISTS sales_tax_value;
ALTER TABLE quotation_items DROP COLUMN IF EXISTS sales_tax_value;

ALTER TABLE purchase_items
  MODIFY quantity DECIMAL(14,4) NOT NULL,
  MODIFY unit_cost DECIMAL(14,6) NOT NULL DEFAULT 0;

ALTER TABLE quotation_items
  MODIFY quantity DECIMAL(14,4) NOT NULL,
  MODIFY unit_price DECIMAL(14,6) NOT NULL DEFAULT 0;

ALTER TABLE invoice_items
  MODIFY quantity DECIMAL(14,4) NOT NULL,
  MODIFY unit_price DECIMAL(14,6) NOT NULL DEFAULT 0;

ALTER TABLE invoice_items
  ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (ROUND((quantity * unit_price - discount) * tax_percent / 100,2)) STORED FIRST;

ALTER TABLE quotation_items
  ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (ROUND((quantity * unit_price - discount) * tax_percent / 100,2)) STORED FIRST;

ALTER TABLE stock_movements
  MODIFY quantity DECIMAL(14,4) NOT NULL,
  MODIFY available_before DECIMAL(14,4),
  MODIFY shortfall DECIMAL(14,4) NOT NULL DEFAULT 0;
