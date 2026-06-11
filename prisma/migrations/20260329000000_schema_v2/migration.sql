-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('SERVICE', 'PHYSICAL');

-- DropForeignKey
ALTER TABLE "customer" DROP CONSTRAINT "customer_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "invoice_line_item" DROP CONSTRAINT "invoice_line_item_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "invoice_line_item" DROP CONSTRAINT "invoice_line_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "quote" DROP CONSTRAINT "quote_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "quote_line_item" DROP CONSTRAINT "quote_line_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "quote_line_item" DROP CONSTRAINT "quote_line_item_quote_id_fkey";

-- DropForeignKey
ALTER TABLE "user_organization" DROP CONSTRAINT "user_organization_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "user_organization" DROP CONSTRAINT "user_organization_user_id_fkey";

-- DropIndex
DROP INDEX "customer_organization_id_idx";

-- DropIndex
DROP INDEX "customer_organization_id_is_active_idx";

-- DropIndex
DROP INDEX "invoice_organization_id_customer_id_idx";

-- DropIndex
DROP INDEX "invoice_organization_id_due_date_idx";

-- DropIndex
DROP INDEX "invoice_organization_id_invoice_number_key";

-- DropIndex
DROP INDEX "invoice_organization_id_status_idx";

-- DropIndex
DROP INDEX "product_organization_id_idx";

-- DropIndex
DROP INDEX "product_organization_id_is_active_idx";

-- DropIndex
DROP INDEX "quote_organization_id_customer_id_idx";

-- DropIndex
DROP INDEX "quote_organization_id_quote_number_key";

-- DropIndex
DROP INDEX "quote_organization_id_status_idx";

-- AlterTable
ALTER TABLE "customer" DROP COLUMN "first_name",
DROP COLUMN "id_number",
DROP COLUMN "last_name",
DROP COLUMN "organization_id",
ADD COLUMN     "contact_id" TEXT,
ADD COLUMN     "organisation_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoice" DROP COLUMN "organization_id",
DROP COLUMN "source_quote_id",
ADD COLUMN     "organisation_id" TEXT NOT NULL,
ADD COLUMN     "quote_id" TEXT;

-- AlterTable
ALTER TABLE "product" DROP COLUMN "is_taxable",
DROP COLUMN "organization_id",
ADD COLUMN     "default_tax_id" TEXT,
ADD COLUMN     "organisation_id" TEXT NOT NULL,
ADD COLUMN     "type" "product_type" NOT NULL DEFAULT 'SERVICE';

-- AlterTable
ALTER TABLE "quote" DROP COLUMN "organization_id",
ADD COLUMN     "organisation_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "name",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;

-- DropTable
DROP TABLE "invoice_line_item";

-- DropTable
DROP TABLE "organization";

-- DropTable
DROP TABLE "quote_line_item";

-- DropTable
DROP TABLE "user_organization";

-- CreateTable
CREATE TABLE "organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trading_name" TEXT,
    "company_reg_no" TEXT,
    "vat_number" TEXT,
    "logo_url" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" TEXT,
    "province" "sa_province",
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bank_name" TEXT,
    "bank_account_name" TEXT,
    "bank_account_no" TEXT,
    "bank_branch_code" TEXT,
    "bank_account_type" "bank_account_type",
    "quote_prefix" TEXT NOT NULL DEFAULT 'QUO',
    "invoice_prefix" TEXT NOT NULL DEFAULT 'INV',
    "next_quote_no" INTEGER NOT NULL DEFAULT 1,
    "next_invoice_no" INTEGER NOT NULL DEFAULT 1,
    "default_payment_terms_days" INTEGER NOT NULL DEFAULT 30,
    "default_quote_valid_days" INTEGER NOT NULL DEFAULT 30,
    "default_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(6,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organisation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "role" "org_role" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "id_number" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_item" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "product_id" TEXT,
    "tax_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "unit_type" TEXT NOT NULL DEFAULT 'item',
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_item_pkey" PRIMARY KEY ("id")
);

-- CHECK constraint for polymorphic source column
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_source_check"
    CHECK (source IN ('quote', 'invoice'));

-- CreateIndex
CREATE INDEX "tax_organisation_id_is_active_idx" ON "tax"("organisation_id", "is_active");

-- CreateIndex
CREATE INDEX "user_organisation_organisation_id_idx" ON "user_organisation"("organisation_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_organisation_user_id_organisation_id_key" ON "user_organisation"("user_id", "organisation_id");

-- CreateIndex
CREATE INDEX "contact_organisation_id_idx" ON "contact"("organisation_id");

-- CreateIndex
CREATE INDEX "contact_organisation_id_is_active_idx" ON "contact"("organisation_id", "is_active");

-- CreateIndex
CREATE INDEX "line_item_source_source_id_idx" ON "line_item"("source", "source_id");

-- CreateIndex
CREATE INDEX "customer_organisation_id_idx" ON "customer"("organisation_id");

-- CreateIndex
CREATE INDEX "customer_organisation_id_is_active_idx" ON "customer"("organisation_id", "is_active");

-- CreateIndex
CREATE INDEX "invoice_organisation_id_status_idx" ON "invoice"("organisation_id", "status");

-- CreateIndex
CREATE INDEX "invoice_organisation_id_due_date_idx" ON "invoice"("organisation_id", "due_date");

-- CreateIndex
CREATE INDEX "invoice_organisation_id_customer_id_idx" ON "invoice"("organisation_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_organisation_id_invoice_number_key" ON "invoice"("organisation_id", "invoice_number");

-- CreateIndex
CREATE INDEX "product_organisation_id_idx" ON "product"("organisation_id");

-- CreateIndex
CREATE INDEX "product_organisation_id_is_active_idx" ON "product"("organisation_id", "is_active");

-- CreateIndex
CREATE INDEX "quote_organisation_id_status_idx" ON "quote"("organisation_id", "status");

-- CreateIndex
CREATE INDEX "quote_organisation_id_customer_id_idx" ON "quote"("organisation_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_organisation_id_quote_number_key" ON "quote"("organisation_id", "quote_number");

-- AddForeignKey
ALTER TABLE "tax" ADD CONSTRAINT "tax_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organisation" ADD CONSTRAINT "user_organisation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organisation" ADD CONSTRAINT "user_organisation_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_default_tax_id_fkey" FOREIGN KEY ("default_tax_id") REFERENCES "tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;
