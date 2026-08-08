-- Stripe Identity + clôture location en 2 étapes (champs absents de init)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeIdentityVerificationId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeIdentityStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeIdentityLastError" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeIdentityVerificationId_key" ON "User"("stripeIdentityVerificationId");

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "renterCompletedAt" TIMESTAMP(3);
