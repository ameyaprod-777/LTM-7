-- AlterEnum
CREATE TYPE "PayoutMethod" AS ENUM ('MANUAL_IBAN', 'STRIPE_CONNECT');
CREATE TYPE "ManualPayoutStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "payoutMethod" "PayoutMethod" NOT NULL DEFAULT 'MANUAL_IBAN';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ibanEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ibanLast4" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ibanHolderName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ibanUpdatedAt" TIMESTAMP(3);

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "manualPayoutStatus" "ManualPayoutStatus";
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "manualPayoutPaidAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "manualPayoutPaidById" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "manualPayoutNote" TEXT;

-- ForeignKey
DO $$ BEGIN
  ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_manualPayoutPaidById_fkey"
    FOREIGN KEY ("manualPayoutPaidById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Payment_manualPayoutStatus_idx" ON "Payment"("manualPayoutStatus");
