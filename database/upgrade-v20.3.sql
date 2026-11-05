-- Add an explicit editable HS sale-type suggestion. No inferred tax classifications.
SET NAMES utf8mb4;
DELIMITER //
DROP PROCEDURE IF EXISTS ba_v203_upgrade//
CREATE PROCEDURE ba_v203_upgrade()
BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='custom_hs_codes' AND column_name='type_of_goods') THEN
  ALTER TABLE custom_hs_codes ADD COLUMN type_of_goods VARCHAR(200) NULL;
 END IF;
 -- A missing unique key would allow validation-state rows to multiply.
 -- Do not silently delete state rows: they may contain accepted FBR numbers.
 IF EXISTS(SELECT 1 FROM fbr_invoice_state GROUP BY invoice_id,environment HAVING COUNT(*)>1) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Duplicate FBR states found. Preserve FBR history and reconcile states before upgrade; do not delete financial invoices.';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='fbr_invoice_state' AND non_unique=0 GROUP BY index_name HAVING COUNT(*)=2 AND GROUP_CONCAT(column_name ORDER BY seq_in_index)='invoice_id,environment') THEN
  ALTER TABLE fbr_invoice_state ADD UNIQUE KEY ba_v203_invoice_environment(invoice_id,environment);
 END IF;
END//
CALL ba_v203_upgrade()//
DROP PROCEDURE ba_v203_upgrade//
DELIMITER ;
-- Diagnostic: every result must have one row. Activity history is intentionally retained.
SELECT invoice_id,environment,COUNT(*) AS state_rows FROM fbr_invoice_state GROUP BY invoice_id,environment HAVING COUNT(*)>1;