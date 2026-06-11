-- DropForeignKey
ALTER TABLE "contact" DROP CONSTRAINT "contact_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "line_item" DROP CONSTRAINT "line_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "line_item" DROP CONSTRAINT "line_item_tax_id_fkey";

-- DropIndex
DROP INDEX "contact_organisation_id_idx";

-- DropIndex
DROP INDEX "contact_organisation_id_is_active_idx";

-- AlterTable
ALTER TABLE "contact" DROP COLUMN "organisation_id";

-- AlterTable
ALTER TABLE "line_item" DROP COLUMN "description",
DROP COLUMN "product_id",
DROP COLUMN "unit_price",
DROP COLUMN "unit_type",
ADD COLUMN     "type" INTEGER NOT NULL DEFAULT 2,
ALTER COLUMN "tax_id" SET NOT NULL;

-- Remove the DEFAULT we just added (only needed to satisfy NOT NULL for existing rows)
ALTER TABLE "line_item" ALTER COLUMN "type" DROP DEFAULT;

-- CreateTable
CREATE TABLE "contact_organisation" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_line_item" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "unit_type" TEXT NOT NULL DEFAULT 'item',

    CONSTRAINT "product_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_line_item" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "unit_type" TEXT NOT NULL DEFAULT 'item',

    CONSTRAINT "custom_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_organisation_organisation_id_idx" ON "contact_organisation"("organisation_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_organisation_contact_id_organisation_id_key" ON "contact_organisation"("contact_id", "organisation_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_line_item_line_item_id_key" ON "product_line_item"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_line_item_line_item_id_key" ON "custom_line_item"("line_item_id");

-- AddForeignKey
ALTER TABLE "contact_organisation" ADD CONSTRAINT "contact_organisation_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_organisation" ADD CONSTRAINT "contact_organisation_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_line_item" ADD CONSTRAINT "product_line_item_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_line_item" ADD CONSTRAINT "product_line_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_line_item" ADD CONSTRAINT "custom_line_item_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
