CREATE TABLE "synced_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_employee_id" text NOT NULL,
	"names" text,
	"last_names" text,
	"identification" text,
	"position" text,
	"area" text,
	"salary" numeric(14, 2),
	"status" text,
	"contract" jsonb,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_employees_alegra_employee_id_unique" UNIQUE("alegra_employee_id")
);
--> statement-breakpoint
CREATE TABLE "synced_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_bill_id" text NOT NULL,
	"number_full" text,
	"alegra_provider_id" text,
	"provider_name" text,
	"date" date,
	"due_date" date,
	"status" text,
	"subtotal" numeric(14, 2),
	"tax" numeric(14, 2),
	"total" numeric(14, 2),
	"total_paid" numeric(14, 2),
	"balance" numeric(14, 2),
	"currency_code" text DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(14, 4),
	"cost_center" text,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_bills_alegra_bill_id_unique" UNIQUE("alegra_bill_id")
);
--> statement-breakpoint
CREATE TABLE "synced_supplier_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_payment_id" text NOT NULL,
	"alegra_provider_id" text,
	"provider_name" text,
	"date" date,
	"amount" numeric(14, 2),
	"categories" jsonb,
	"bill_ids" jsonb,
	"bank_account" text,
	"cost_center" text,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_supplier_payments_alegra_payment_id_unique" UNIQUE("alegra_payment_id")
);
--> statement-breakpoint
CREATE TABLE "synced_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_bank_id" text NOT NULL,
	"name" text NOT NULL,
	"number" text,
	"type" text,
	"status" text,
	"balance" numeric(14, 2),
	"main_currency_balance" numeric(14, 2),
	"currency_code" text DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(14, 4),
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_bank_accounts_alegra_bank_id_unique" UNIQUE("alegra_bank_id")
);
--> statement-breakpoint
CREATE TABLE "synced_bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_transaction_id" text NOT NULL,
	"alegra_bank_id" text NOT NULL,
	"date" date,
	"amount" numeric(14, 2),
	"type" text,
	"status" text,
	"movement_type" text,
	"client_name" text,
	"client_identification" text,
	"associations" text,
	"anotation" text,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_bank_transactions_alegra_transaction_id_unique" UNIQUE("alegra_transaction_id")
);
--> statement-breakpoint
CREATE INDEX "bank_transactions_bank_date_idx" ON "synced_bank_transactions" USING btree ("alegra_bank_id","date");