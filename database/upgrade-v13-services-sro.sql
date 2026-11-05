-- v13: Labor replaced by HS-code service lines; SRO and Buyer Type masters; buyer type on documents. Safe to re-run.
-- Historical labor_percent / labor_amount columns are kept (deprecated) so old invoices still open and print.
DELIMITER //
DROP PROCEDURE IF EXISTS ba_v13_add_column//
CREATE PROCEDURE ba_v13_add_column(IN t VARCHAR(64),IN col VARCHAR(64),IN definition TEXT)
BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=t AND column_name=col) THEN
  SET @s=CONCAT('ALTER TABLE `',t,'` ADD COLUMN `',col,'` ',definition);PREPARE st FROM @s;EXECUTE st;DEALLOCATE PREPARE st;
 END IF;
END//
DELIMITER ;
CREATE TABLE IF NOT EXISTS sro_master (serial_number BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,id CHAR(36) PRIMARY KEY,name VARCHAR(200) NOT NULL UNIQUE,description VARCHAR(1000) NULL,status ENUM('active','inactive') NOT NULL DEFAULT 'active',verification ENUM('draft','unverified','verified') NOT NULL DEFAULT 'unverified',created_by CHAR(36),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS buyer_types (serial_number BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,id CHAR(36) PRIMARY KEY,name VARCHAR(200) NOT NULL UNIQUE,status ENUM('active','inactive') NOT NULL DEFAULT 'active',verification ENUM('draft','unverified','verified') NOT NULL DEFAULT 'unverified',created_by CHAR(36),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CALL ba_v13_add_column('quotation_items','item_kind',"ENUM('goods','service') NOT NULL DEFAULT 'goods'");
CALL ba_v13_add_column('quotation_items','service_percent','DECIMAL(7,2) NULL');
CALL ba_v13_add_column('quotation_items','sro_schedule_no','VARCHAR(200) NULL');
CALL ba_v13_add_column('quotation_items','sro_item_serial_no','VARCHAR(100) NULL');
CALL ba_v13_add_column('invoice_items','item_kind',"ENUM('goods','service') NOT NULL DEFAULT 'goods'");
CALL ba_v13_add_column('invoice_items','service_percent','DECIMAL(7,2) NULL');
CALL ba_v13_add_column('invoice_items','sro_schedule_no','VARCHAR(200) NULL');
CALL ba_v13_add_column('invoice_items','sro_item_serial_no','VARCHAR(100) NULL');
CALL ba_v13_add_column('quotations','buyer_type',"ENUM('Registered','Unregistered') NULL");
CALL ba_v13_add_column('invoices','buyer_type',"ENUM('Registered','Unregistered') NULL");
DROP PROCEDURE IF EXISTS ba_v13_add_column;
UPDATE invoices i JOIN departments d ON d.id=i.department_id SET i.buyer_type=d.registration_type WHERE i.buyer_type IS NULL AND d.registration_type IN ('Registered','Unregistered');
UPDATE quotations q JOIN departments d ON d.id=q.department_id SET q.buyer_type=d.registration_type WHERE q.buyer_type IS NULL AND d.registration_type IN ('Registered','Unregistered');
INSERT IGNORE INTO buyer_types(id,name,verification) VALUES(UUID(),'Registered','verified');
INSERT IGNORE INTO buyer_types(id,name,verification) VALUES(UUID(),'Unregistered','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'01(I)/2022','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1007(I)/2005','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1125(I)/2011','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1167(I)/2018','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1180(I)/2016','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1212(I)/2018','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'125(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1308(I)/2018','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1450(I)/2021','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1579(1)/2021','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1604(I)/2021','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1636(1)/2022','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'164(I)/2010','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'172(I)/2006','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'183(I)/2022','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'188(I)/2015','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'1st Schedule FED','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'21(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'213(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'223(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'237(I)/2020','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'253(I)/2019','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'292(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'297(I)/2023-Table-I','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'297(I)/2023-Table-II','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'321(I)/2022','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'326(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'327(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'398(I)/2015','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'3rd Schd Table II','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'3rd Schedule goods','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'408(I)/2012','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'408(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'484(I)/2015','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'495(I)/2016','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'499(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'501(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'525(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'539(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'542(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'549(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'551(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'572(I)/2014','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'581(1)/2024','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'581(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'587(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'590(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'5th Schedule','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'608(I)/2012','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'641(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'646(I)/2005','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'657(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'670(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'678(I)/2004','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'6th Schd Table I','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'6th Schd Table II','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'6th Schd Table III','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'6th Schedule','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'713(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'727(I)/2011','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'757(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'76(I)/2008','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'760(I)/2012','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'777(I)2018','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'781(I)2018','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'79(I)/2012','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'802(I)/2009','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'811(I)/2009','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'863(I)/2007','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'867(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'88(I)/2022','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'880(I)/2007','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'896(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'898(I)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'8th Schedules','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'91(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'946(1)/2013','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'984(I)/2017','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'9th Schedule','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'9th Schedules','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'DTRE','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'EIGHTH SCHEDULE Table 1','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'EIGHTH SCHEDULE Table 2','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'FED 3rd Schd Table I','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'FED 3rd Schd Table II','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'FIFTH SCHEDULE','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'ICTO','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'ICTO TABLE I','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'ICTO TABLE II','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'NINTH SCHEDULE','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'Section 4(b)','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'SECTION 49','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'SRO 342 (I)/2002','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'Zero Rated Elec.','verified');
INSERT IGNORE INTO sro_master(id,name,verification) VALUES(UUID(),'Zero Rated Gas','verified');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'sro_master','view');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'sro_master','create');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'sro_master','edit');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'sro_master','delete');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'sro_master','verify');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'sro_master','export');
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT rp.role_id,p2.id FROM role_permissions rp JOIN permissions p1 ON p1.id=rp.permission_id AND p1.module='units_of_measurement' JOIN permissions p2 ON p2.module='sro_master' AND p2.action=p1.action;
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'buyer_types','view');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'buyer_types','create');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'buyer_types','edit');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'buyer_types','delete');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'buyer_types','verify');
INSERT IGNORE INTO permissions(id,module,action) VALUES(UUID(),'buyer_types','export');
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT rp.role_id,p2.id FROM role_permissions rp JOIN permissions p1 ON p1.id=rp.permission_id AND p1.module='units_of_measurement' JOIN permissions p2 ON p2.module='buyer_types' AND p2.action=p1.action;
DELIMITER //
DROP TRIGGER IF EXISTS ba_v13_delete_sro_master//
CREATE TRIGGER ba_v13_delete_sro_master BEFORE DELETE ON sro_master FOR EACH ROW BEGIN
IF OLD.verification='verified' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Verified records cannot be deleted'; END IF;
IF EXISTS(SELECT 1 FROM quotation_items WHERE sro_schedule_no=OLD.name) OR EXISTS(SELECT 1 FROM invoice_items WHERE sro_schedule_no=OLD.name) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='This value is used by a transaction; deactivate it instead'; END IF;
END//
DROP TRIGGER IF EXISTS ba_v13_delete_buyer_types//
CREATE TRIGGER ba_v13_delete_buyer_types BEFORE DELETE ON buyer_types FOR EACH ROW BEGIN
IF OLD.verification='verified' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Verified records cannot be deleted'; END IF;
IF EXISTS(SELECT 1 FROM quotations WHERE buyer_type=OLD.name) OR EXISTS(SELECT 1 FROM invoices WHERE buyer_type=OLD.name) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='This value is used by a transaction; deactivate it instead'; END IF;
END//
DELIMITER ;
