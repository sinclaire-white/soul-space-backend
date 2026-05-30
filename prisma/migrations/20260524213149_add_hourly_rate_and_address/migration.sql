-- AlterTable
ALTER TABLE "consultant_applications" ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ALTER COLUMN "availabilityDays" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "availableFrom" SET DEFAULT '10:00',
ALTER COLUMN "availableTo" SET DEFAULT '22:00';

-- AlterTable
ALTER TABLE "consultants" ADD COLUMN     "address" VARCHAR(500);
