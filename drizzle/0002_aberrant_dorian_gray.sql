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
CREATE TABLE "synced_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_contact_id" text NOT NULL,
	"name" text NOT NULL,
	"nit" text,
	"email" text,
	"phone" text,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_providers_alegra_contact_id_unique" UNIQUE("alegra_contact_id")
);
--> statement-breakpoint
CREATE TABLE "synced_supplier_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_payment_id" text NOT NULL,
	"alegra_provider_id" text,
	"date" date,
	"amount" numeric(14, 2),
	"bill_ids" jsonb,
	"bank_account" text,
	"cost_center" text,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_supplier_payments_alegra_payment_id_unique" UNIQUE("alegra_payment_id")
);
