/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,pin]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessUsername]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessPassword` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessUsername` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Staff_pin_key";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "businessPassword" TEXT NOT NULL,
ADD COLUMN     "businessUsername" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_ownerId_pin_key" ON "public"."Staff"("ownerId", "pin");

-- CreateIndex
CREATE UNIQUE INDEX "User_businessUsername_key" ON "public"."User"("businessUsername");
