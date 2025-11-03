-- AlterTable: Remove old NextAuth fields from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";
ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "users" DROP COLUMN IF EXISTS "image";
ALTER TABLE "users" DROP COLUMN IF EXISTS "gcalId";

-- Drop old index if exists
DROP INDEX IF EXISTS "users_email_key";
