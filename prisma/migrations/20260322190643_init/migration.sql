-- CreateEnum
CREATE TYPE "sa_province" AS ENUM ('EASTERN_CAPE', 'FREE_STATE', 'GAUTENG', 'KWAZULU_NATAL', 'LIMPOPO', 'MPUMALANGA', 'NORTH_WEST', 'NORTHERN_CAPE', 'WESTERN_CAPE');

-- CreateEnum
CREATE TYPE "bank_account_type" AS ENUM ('CHEQUE', 'SAVINGS', 'TRANSMISSION');

-- CreateEnum
CREATE TYPE "global_role" AS ENUM ('USER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "org_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('BUSINESS', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "quote_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "organization" (
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

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" "global_role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organization" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" "org_role" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "customer_type" NOT NULL DEFAULT 'BUSINESS',
    "company_name" TEXT,
    "trading_name" TEXT,
    "company_reg_no" TEXT,
    "vat_number" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "id_number" TEXT,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "alternate_phone" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" TEXT,
    "province" "sa_province",
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "billing_address_line_1" TEXT,
    "billing_address_line_2" TEXT,
    "billing_city" TEXT,
    "billing_province" "sa_province",
    "billing_postal_code" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "unit_type" TEXT NOT NULL DEFAULT 'item',
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "quote_number" TEXT NOT NULL,
    "status" "quote_status" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "converted_to_invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line_item" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "unit_type" TEXT NOT NULL DEFAULT 'item',
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(15,2) NOT NULL,
    "vat_amount" DECIMAL(15,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "source_quote_id" TEXT,
    "status" "invoice_status" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "payment_reference" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "paid_amount" DECIMAL(15,2),
    "payment_method" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_item" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "unit_type" TEXT NOT NULL DEFAULT 'item',
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(15,2) NOT NULL,
    "vat_amount" DECIMAL(15,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_organization_organization_id_idx" ON "user_organization"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_organization_user_id_organization_id_key" ON "user_organization"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "customer_organization_id_idx" ON "customer"("organization_id");

-- CreateIndex
CREATE INDEX "customer_organization_id_is_active_idx" ON "customer"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "product_organization_id_idx" ON "product"("organization_id");

-- CreateIndex
CREATE INDEX "product_organization_id_is_active_idx" ON "product"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "quote_converted_to_invoice_id_key" ON "quote"("converted_to_invoice_id");

-- CreateIndex
CREATE INDEX "quote_organization_id_status_idx" ON "quote"("organization_id", "status");

-- CreateIndex
CREATE INDEX "quote_organization_id_customer_id_idx" ON "quote"("organization_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_organization_id_quote_number_key" ON "quote"("organization_id", "quote_number");

-- CreateIndex
CREATE INDEX "quote_line_item_quote_id_idx" ON "quote_line_item"("quote_id");

-- CreateIndex
CREATE INDEX "invoice_organization_id_status_idx" ON "invoice"("organization_id", "status");

-- CreateIndex
CREATE INDEX "invoice_organization_id_due_date_idx" ON "invoice"("organization_id", "due_date");

-- CreateIndex
CREATE INDEX "invoice_organization_id_customer_id_idx" ON "invoice"("organization_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_organization_id_invoice_number_key" ON "invoice"("organization_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_line_item_invoice_id_idx" ON "invoice_line_item"("invoice_id");

-- AddForeignKey
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_converted_to_invoice_id_fkey" FOREIGN KEY ("converted_to_invoice_id") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_item" ADD CONSTRAINT "quote_line_item_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_item" ADD CONSTRAINT "quote_line_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
