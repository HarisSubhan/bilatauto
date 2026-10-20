-- Additive, rerunnable v10 upgrade: FBR IRIS Digital Invoicing (Sandbox + Production).
-- Back up first. Existing invoices, numbers and stock are not changed.
SET NAMES utf8mb4;

-- One row per environment. Tokens are stored encrypted (AES-256-GCM, key from FBR_SECRET_KEY / JWT_SECRET)
-- and are never returned to the browser; only the last 4 characters are shown.
CREATE TABLE IF NOT EXISTS fbr_config (
  environment ENUM('sandbox','production') PRIMARY KEY,
  post_url VARCHAR(300) NOT NULL,
  validate_url VARCHAR(300) NOT NULL,
  token_enc TEXT NULL,
  token_last4 VARCHAR(8) NULL,
  last_test_at DATETIME NULL,
  last_test_ok TINYINT(1) NULL,
  last_test_message TEXT NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO fbr_config(environment, post_url, validate_url) VALUES
 ('sandbox','https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb','https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb'),
 ('production','https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata','https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata');

-- FBR state of each invoice, kept separately for Sandbox and Production.
CREATE TABLE IF NOT EXISTS fbr_invoice_state (
  invoice_id CHAR(36) NOT NULL,
  environment ENUM('sandbox','production') NOT NULL,
  status ENUM('not_validated','validation_failed','validated','submitting','sent','submission_failed','pending_confirmation') NOT NULL DEFAULT 'not_validated',
  scenario_id VARCHAR(10) NULL,
  fbr_invoice_number VARCHAR(100) NULL,
  payload_hash CHAR(64) NULL,
  last_errors JSON NULL,
  validated_at DATETIME NULL,
  submitted_at DATETIME NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(invoice_id, environment),
  INDEX(environment, status),
  FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Every connection test / validation / submission with the exact request and response.
CREATE TABLE IF NOT EXISTS fbr_submissions (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NULL,
  environment ENUM('sandbox','production') NOT NULL,
  action ENUM('test','validate','submit') NOT NULL,
  outcome VARCHAR(40) NOT NULL,
  http_status INT NULL,
  fbr_invoice_number VARCHAR(100) NULL,
  request_json JSON NULL,
  response_json JSON NULL,
  error_message TEXT NULL,
  user_id CHAR(36) NULL,
  user_name VARCHAR(200) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(invoice_id), INDEX(environment, created_at)
);

-- Cached FBR reference lists (provinces, UOM) loaded with the user's own token.
CREATE TABLE IF NOT EXISTS fbr_reference (
  list_name VARCHAR(40) NOT NULL,
  code VARCHAR(40) NOT NULL,
  description VARCHAR(300) NOT NULL,
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(list_name, code)
);

DELIMITER //
DROP PROCEDURE IF EXISTS ba_v10_add_column//
CREATE PROCEDURE ba_v10_add_column(IN t VARCHAR(64),IN col VARCHAR(64),IN definition TEXT)
BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=t AND column_name=col) THEN
  SET @s=CONCAT('ALTER TABLE `',t,'` ADD COLUMN `',col,'` ',definition);PREPARE st FROM @s;EXECUTE st;DEALLOCATE PREPARE st;
 END IF;
END//
DELIMITER ;
CALL ba_v10_add_column('departments','province','VARCHAR(100) NULL');
CALL ba_v10_add_column('departments','registration_type',"ENUM('Registered','Unregistered') NULL");
DROP PROCEDURE ba_v10_add_column;

-- An invoice accepted by FBR Production can never be deleted or edited.
DELIMITER //
DROP TRIGGER IF EXISTS ba_v10_block_sent_invoice_delete//
CREATE TRIGGER ba_v10_block_sent_invoice_delete BEFORE DELETE ON invoices FOR EACH ROW BEGIN
 IF EXISTS(SELECT 1 FROM fbr_invoice_state WHERE invoice_id=OLD.id AND environment='production' AND status IN ('sent','submitting','pending_confirmation')) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='This invoice was sent to FBR and cannot be deleted';
 END IF;
END//
DELIMITER ;

INSERT IGNORE INTO system_settings(`key`,value) VALUES ('fbr_active_environment','sandbox');
INSERT IGNORE INTO system_settings(`key`,value) VALUES ('fbr_production_approved','0');
INSERT IGNORE INTO system_settings(`key`,value) VALUES ('fbr_default_scenario','SN001');
INSERT IGNORE INTO system_settings(`key`,value) VALUES ('fbr_seller_ntn','');
INSERT IGNORE INTO system_settings(`key`,value) VALUES ('fbr_seller_province','');

INSERT IGNORE INTO permissions(id,module,action) VALUES ('00000000-0000-4000-8000-0000000f0001','fbr','view');
INSERT IGNORE INTO permissions(id,module,action) VALUES ('00000000-0000-4000-8000-0000000f0002','fbr','validate');
INSERT IGNORE INTO permissions(id,module,action) VALUES ('00000000-0000-4000-8000-0000000f0003','fbr','submit');
INSERT IGNORE INTO permissions(id,module,action) VALUES ('00000000-0000-4000-8000-0000000f0004','fbr','configure');
-- Admin role (if present) gets view/validate/submit; Super Admin always has everything.
INSERT IGNORE INTO role_permissions(role_id, permission_id)
 SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module='fbr' AND p.action IN ('view','validate','submit') WHERE r.slug='admin';
