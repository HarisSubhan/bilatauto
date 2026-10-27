-- v20: Fixed / Notified Value or Retail Price on sales lines (3rd Schedule goods).
-- Back up your database first. Run once after upgrade-v19.sql; rerunning is safe.
-- Sales tax of a line is charged on the retail price when one is stored, otherwise on quantity x price.
DELIMITER //
DROP PROCEDURE IF EXISTS ba_upgrade_v20//
CREATE PROCEDURE ba_upgrade_v20()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='invoice_items' AND COLUMN_NAME='retail_sales_value') THEN
    ALTER TABLE invoice_items ADD COLUMN retail_sales_value DECIMAL(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_items' AND COLUMN_NAME='retail_sales_value') THEN
    ALTER TABLE quotation_items ADD COLUMN retail_sales_value DECIMAL(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='invoice_items' AND COLUMN_NAME='sales_tax_value') THEN
    ALTER TABLE invoice_items DROP COLUMN sales_tax_value;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_items' AND COLUMN_NAME='sales_tax_value') THEN
    ALTER TABLE quotation_items DROP COLUMN sales_tax_value;
  END IF;
  ALTER TABLE invoice_items ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (ROUND((CASE WHEN retail_sales_value > 0 THEN retail_sales_value ELSE quantity * unit_price - discount END) * tax_percent / 100,2)) STORED FIRST;
  ALTER TABLE quotation_items ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (ROUND((CASE WHEN retail_sales_value > 0 THEN retail_sales_value ELSE quantity * unit_price - discount END) * tax_percent / 100,2)) STORED FIRST;
END//
CALL ba_upgrade_v20()//
DROP PROCEDURE ba_upgrade_v20//
DELIMITER ;
