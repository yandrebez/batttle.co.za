-- Seed admin user for initial admin login
-- Default credentials:
--   email: admin@battle.store
--   password: Admin12345!
-- Change password immediately after first login.

INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES (
  'admin-seed-user',
  'admin@battle.store',
  '$2b$10$EbVVDNY3J6EN8gOIrp0Luu0ZpTmByEvqFDTgBn6mXrZ4TrnxmxiHu',
  'Battle Admin',
  'ADMIN'::"Role",
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE
SET
  "password" = EXCLUDED."password",
  "name" = EXCLUDED."name",
  "role" = 'ADMIN'::"Role",
  "updatedAt" = NOW();
