-- New accounts must never default to a privileged role.
-- Existing rows are left untouched; the seed grants SUPER_ADMIN explicitly.
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'PLATFORM_USER';
