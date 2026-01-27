/*
  Warnings:

  - A unique constraint covering the columns `[share_token]` on the table `itineraries` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "itineraries" ADD COLUMN     "accessibility_needs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dietary_restrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_share_token_key" ON "itineraries"("share_token");

-- CreateIndex
CREATE INDEX "itineraries_share_token_idx" ON "itineraries"("share_token");
