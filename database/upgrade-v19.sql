-- v19: safe master deletion and optional automatic Sandbox progress.
-- Back up your database first. Run once after all v18 upgrades; rerunning is safe.
DELIMITER //
DROP PROCEDURE IF EXISTS ba_upgrade_v19//
CREATE PROCEDURE ba_upgrade_v19()
BEGIN
  DECLARE finished INT DEFAULT 0;
  DECLARE tbl VARCHAR(64);
  DECLARE masters CURSOR FOR SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('departments','suppliers','fbr_hs_codes','custom_hs_codes','type_of_goods','units_of_measurement','sro_master','buyer_types');
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished=1;
  OPEN masters;
  master_loop: LOOP
    FETCH masters INTO tbl;
    IF finished=1 THEN LEAVE master_loop; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=tbl AND COLUMN_NAME='deleted_at') THEN
      SET @ddl=CONCAT('ALTER TABLE `',tbl,'` ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL');
      PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
  END LOOP;
  CLOSE masters;
END//
CALL ba_upgrade_v19()//
DROP PROCEDURE ba_upgrade_v19//
DELIMITER ;

CREATE TABLE IF NOT EXISTS fbr_auto_sandbox (
  id TINYINT PRIMARY KEY,
  status VARCHAR(40) NOT NULL DEFAULT 'not_started',
  fbr_invoice_number VARCHAR(100),
  last_message TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO fbr_auto_sandbox(id,status) VALUES (1,'not_started');