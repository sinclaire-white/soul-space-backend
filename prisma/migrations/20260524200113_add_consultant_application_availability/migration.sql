/*
  Warnings:

  - Added the required column `availableFrom` to the `consultant_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availableTo` to the `consultant_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "consultant_applications" ADD COLUMN     "availabilityDays" TEXT[],
ADD COLUMN     "availableFrom" VARCHAR(5) NOT NULL,
ADD COLUMN     "availableTo" VARCHAR(5) NOT NULL;
