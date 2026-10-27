-- Run once on an EXISTING v7 database (new installs: migration.sql already includes this).
ALTER TABLE quotation_items ADD COLUMN labor_percent DECIMAL(6,2) NOT NULL DEFAULT 0, ADD COLUMN labor_amount DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN fbr_hs_code VARCHAR(50);
ALTER TABLE invoice_items ADD COLUMN labor_percent DECIMAL(6,2) NOT NULL DEFAULT 0, ADD COLUMN labor_amount DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN fbr_hs_code VARCHAR(50);
ALTER TABLE invoices ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'quotation';
ALTER TABLE custom_hs_codes ADD COLUMN fbr_hs_code VARCHAR(50);
INSERT INTO document_counters(prefix,last_value,padding) VALUES ('INV',425,3),('STI',425,3),('QUO',480,3)
  ON DUPLICATE KEY UPDATE last_value=GREATEST(last_value,VALUES(last_value)), padding=3;
