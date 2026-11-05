-- Additive, rerunnable v9 upgrade for an existing v8 database. Back up first.
-- Existing documents, accounts, counters and historical values are not reset.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS type_of_goods (serial_number BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,id CHAR(36) PRIMARY KEY,name VARCHAR(200) NOT NULL UNIQUE,status ENUM('active','inactive') NOT NULL DEFAULT 'active',verification ENUM('draft','unverified','verified') NOT NULL DEFAULT 'unverified',created_by CHAR(36),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS units_of_measurement (serial_number BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,id CHAR(36) PRIMARY KEY,name VARCHAR(200) NOT NULL UNIQUE,status ENUM('active','inactive') NOT NULL DEFAULT 'active',verification ENUM('draft','unverified','verified') NOT NULL DEFAULT 'unverified',created_by CHAR(36),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
DELIMITER //
DROP PROCEDURE IF EXISTS ba_v9_add_column//
CREATE PROCEDURE ba_v9_add_column(IN t VARCHAR(64),IN col VARCHAR(64),IN definition TEXT)
BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=t AND column_name=col) THEN
  SET @s=CONCAT('ALTER TABLE `',t,'` ADD COLUMN `',col,'` ',definition);PREPARE st FROM @s;EXECUTE st;DEALLOCATE PREPARE st;
 END IF;
END//
DELIMITER ;
CALL ba_v9_add_column('purchase_items','type_of_goods_id','CHAR(36) NULL');
CALL ba_v9_add_column('purchase_items','uom_id','CHAR(36) NULL');
CALL ba_v9_add_column('purchase_items','type_of_goods','VARCHAR(200) NULL');
CALL ba_v9_add_column('purchase_items','product_name','VARCHAR(250) NULL');
CALL ba_v9_add_column('quotation_items','type_of_goods_id','CHAR(36) NULL');
CALL ba_v9_add_column('quotation_items','uom_id','CHAR(36) NULL');
CALL ba_v9_add_column('quotation_items','type_of_goods','VARCHAR(200) NULL');
CALL ba_v9_add_column('quotation_items','product_name','VARCHAR(250) NULL');
CALL ba_v9_add_column('invoice_items','type_of_goods_id','CHAR(36) NULL');
CALL ba_v9_add_column('invoice_items','uom_id','CHAR(36) NULL');
CALL ba_v9_add_column('invoice_items','type_of_goods','VARCHAR(200) NULL');
CALL ba_v9_add_column('invoice_items','product_name','VARCHAR(250) NULL');
CALL ba_v9_add_column('purchase_items','line_position','INT NOT NULL DEFAULT 0');
CALL ba_v9_add_column('quotation_items','line_position','INT NOT NULL DEFAULT 0');
CALL ba_v9_add_column('invoice_items','line_position','INT NOT NULL DEFAULT 0');
CALL ba_v9_add_column('purchase_items','retail_sales_value','DECIMAL(14,2) NOT NULL DEFAULT 0');
CALL ba_v9_add_column('purchases','supplier_ntn','VARCHAR(200) NULL');
CALL ba_v9_add_column('purchases','supplier_name','VARCHAR(200) NULL');
CALL ba_v9_add_column('invoices','buyer_ntn','VARCHAR(200) NULL');
CALL ba_v9_add_column('invoices','buyer_name','VARCHAR(200) NULL');
DROP PROCEDURE ba_v9_add_column;
DELIMITER //
DROP TRIGGER IF EXISTS ba_v9_delete_type_of_goods//
CREATE TRIGGER ba_v9_delete_type_of_goods BEFORE DELETE ON type_of_goods FOR EACH ROW BEGIN
IF OLD.verification='verified' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Verified records cannot be deleted'; END IF;
IF EXISTS(SELECT 1 FROM purchase_items WHERE type_of_goods_id=OLD.id OR (type_of_goods_id IS NULL AND type_of_goods=OLD.name)) OR EXISTS(SELECT 1 FROM quotation_items WHERE type_of_goods_id=OLD.id OR (type_of_goods_id IS NULL AND type_of_goods=OLD.name)) OR EXISTS(SELECT 1 FROM invoice_items WHERE type_of_goods_id=OLD.id OR (type_of_goods_id IS NULL AND type_of_goods=OLD.name)) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='This value is used by a transaction; deactivate it instead'; END IF;
END//
DELIMITER ;
DELIMITER //
DROP TRIGGER IF EXISTS ba_v9_delete_units_of_measurement//
CREATE TRIGGER ba_v9_delete_units_of_measurement BEFORE DELETE ON units_of_measurement FOR EACH ROW BEGIN
IF OLD.verification='verified' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Verified records cannot be deleted'; END IF;
IF EXISTS(SELECT 1 FROM purchase_items WHERE uom_id=OLD.id OR (uom_id IS NULL AND uom=OLD.name)) OR EXISTS(SELECT 1 FROM quotation_items WHERE uom_id=OLD.id OR (uom_id IS NULL AND uom=OLD.name)) OR EXISTS(SELECT 1 FROM invoice_items WHERE uom_id=OLD.id OR (uom_id IS NULL AND uom=OLD.name)) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='This value is used by a transaction; deactivate it instead'; END IF;
END//
DELIMITER ;
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'3rd Schedule Goods','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Cement /Concrete Block','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'CNG Sales','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Cotton Ginners','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'DTRE goods','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Electric Vehicle','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Electricity Supply to Retailers','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Exempt goods','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Gas to CNG stations','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Goods (FED in ST Mode)','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Goods as per SRO.297(I)/2023','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Goods at Reduced Rate','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Goods at standard rate (default)','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Goods at zero-rate','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Mobile Phones','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Non-Adjustable Supplies','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Petroleum Products','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Potassium Chlorate','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Processing/Conversion of Goods','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Rerollable scrap by ship breakers','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Services','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Services (FED in ST Mode)','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Ship breaking','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'SIM','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Steel Melting and re-rolling','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Sugar','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Telecommunication services','verified');
INSERT IGNORE INTO type_of_goods(id,name,verification) VALUES(UUID(),'Toll Manufacturing','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'40KG','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Bag','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Barrels','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Bill of lading','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Carat','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Cubic Metre','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Dozen','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Foot','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Gallon','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Gram','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'KG','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Kilogram','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'KWH','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Liter','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Mega Watt','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Meter','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'MMBTU','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'MT','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Numbers, pieces, units','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Others','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Packs','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Pair','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Pound','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'SET','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Square Foot','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Square Metre','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'SqY','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Thousand Unit','verified');
INSERT IGNORE INTO units_of_measurement(id,name,verification) VALUES(UUID(),'Timber Logs','verified');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'type_of_goods','view');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'type_of_goods','create');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'type_of_goods','edit');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'type_of_goods','delete');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'type_of_goods','verify');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'type_of_goods','export');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'units_of_measurement','view');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'units_of_measurement','create');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'units_of_measurement','edit');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'units_of_measurement','delete');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'units_of_measurement','verify');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'units_of_measurement','export');
