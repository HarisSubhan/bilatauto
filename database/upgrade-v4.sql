-- Run once on a backed-up existing v3 database before restarting backend.
ALTER TABLE quotations ADD COLUMN vehicle_type VARCHAR(100), ADD COLUMN vehicle_number VARCHAR(100), ADD COLUMN labor_percent DECIMAL(6,2) NOT NULL DEFAULT 0, ADD COLUMN labor_amount DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN vehicle_type VARCHAR(100), ADD COLUMN vehicle_number VARCHAR(100), ADD COLUMN labor_percent DECIMAL(6,2) NOT NULL DEFAULT 0, ADD COLUMN labor_amount DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN sales_tax_number VARCHAR(40) UNIQUE;
ALTER TABLE quotation_items ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (ROUND((quantity * unit_price - discount) * tax_percent / 100, 2)) STORED;
ALTER TABLE invoice_items ADD COLUMN sales_tax_value DECIMAL(14,2) GENERATED ALWAYS AS (ROUND((quantity * unit_price - discount) * tax_percent / 100, 2)) STORED;

UPDATE invoices SET sales_tax_number = CONCAT('STI-LEGACY-', invoice_number) WHERE sales_tax_number IS NULL;
UPDATE invoices i JOIN quotations q ON q.id=i.quotation_id SET i.vehicle_type=q.vehicle_type, i.vehicle_number=q.vehicle_number;
UPDATE invoices SET fbr_status='offline' WHERE fbr_status IS NULL OR fbr_status='not_submitted';
