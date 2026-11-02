-- Creates the PunjabShop database and an app user on this machine.
-- Replace CHANGE_ME with a strong password (and use the same one in DATABASE_URL), then run once:
--   sudo mysql < db/create-database.sql
CREATE DATABASE IF NOT EXISTS punjabshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS punjabshop_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'punjabshop'@'localhost' IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'punjabshop'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON punjabshop.* TO 'punjabshop'@'localhost', 'punjabshop'@'127.0.0.1';
GRANT ALL PRIVILEGES ON punjabshop_shadow.* TO 'punjabshop'@'localhost', 'punjabshop'@'127.0.0.1';
FLUSH PRIVILEGES;
