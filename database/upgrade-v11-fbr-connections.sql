-- Apply after upgrade-v10-fbr.sql. Safe to run more than once.
DELIMITER //
DROP PROCEDURE IF EXISTS ba_v11_connections//
CREATE PROCEDURE ba_v11_connections()
BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='fbr_config' AND column_name='connected') THEN
  ALTER TABLE fbr_config ADD COLUMN connected TINYINT(1) NOT NULL DEFAULT 0;
 END IF;
END//
DELIMITER ;
CALL ba_v11_connections();
DROP PROCEDURE ba_v11_connections;
-- Existing credentials remain encrypted; connect/test again to activate an environment.