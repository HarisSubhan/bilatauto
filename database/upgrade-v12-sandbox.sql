-- v12: Seller settings and the 28 PRAL Sandbox scenarios. Safe to re-run.
CREATE TABLE IF NOT EXISTS fbr_scenarios (
 scenario_id VARCHAR(10) PRIMARY KEY, description VARCHAR(300) NOT NULL, sale_type VARCHAR(200) NOT NULL
);
INSERT IGNORE INTO fbr_scenarios VALUES ('SN001','Goods at standard rate to registered buyers','Goods at standard rate (default)');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN002','Goods at standard rate to unregistered buyers','Goods at standard rate (default)');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN003','Sale of Steel (Melted and Re-Rolled)','Steel Melting and re-rolling');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN004','Sale by Ship Breakers','Ship breaking');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN005','Reduced rate sale','Goods at Reduced Rate');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN006','Exempt goods sale','Exempt goods');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN007','Zero rated sale','Goods at zero-rate');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN008','Sale of 3rd schedule goods','3rd Schedule Goods');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN009','Cotton Spinners purchase from Cotton Ginners (Textile Sector)','Cotton Ginners');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN010','Telecom services rendered or provided','Telecommunication services');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN011','Toll Manufacturing sale by Steel sector','Toll Manufacturing');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN012','Sale of Petroleum products','Petroleum Products');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN013','Electricity Supply to Retailers','Electricity Supply to Retailers');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN014','Sale of Gas to CNG stations','Gas to CNG stations');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN015','Sale of mobile phones','Mobile Phones');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN016','Processing / Conversion of Goods','Processing/Conversion of Goods');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN017','Sale of Goods where FED is charged in ST mode','Goods (FED in ST Mode)');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN018','Services rendered or provided where FED is charged in ST mode','Services (FED in ST Mode)');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN019','Services rendered or provided','Services');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN020','Sale of Electric Vehicles','Electric Vehicle');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN021','Sale of Cement /Concrete Block','Cement /Concrete Block');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN022','Sale of Potassium Chlorate','Potassium Chlorate');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN023','Sale of CNG','CNG Sales');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN024','Goods sold that are listed in SRO 297(1)/2023','Goods as per SRO.297(I)/2023');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN025','Drugs sold at fixed ST rate under serial 81 of Eighth Schedule Table 1','Non-Adjustable Supplies');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN026','Sale to End Consumer by retailers','Goods at standard rate (default)');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN027','Sale to End Consumer by retailers','3rd Schedule Goods');
INSERT IGNORE INTO fbr_scenarios VALUES ('SN028','Sale to End Consumer by retailers','Goods at Reduced Rate');
INSERT IGNORE INTO system_settings(`key`,value) SELECT 'fbr_seller_name',value FROM system_settings WHERE `key`='company_name';
INSERT IGNORE INTO system_settings(`key`,value) SELECT 'fbr_seller_address',value FROM system_settings WHERE `key`='company_address';
INSERT IGNORE INTO system_settings(`key`,value) SELECT 'fbr_seller_cnic',IF(CHAR_LENGTH(value)=13,value,'') FROM system_settings WHERE `key`='fbr_seller_ntn';
UPDATE system_settings SET value='' WHERE `key`='fbr_seller_ntn' AND CHAR_LENGTH(value)=13;
