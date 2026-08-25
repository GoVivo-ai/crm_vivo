CREATE TYPE "public"."project_health" AS ENUM('green', 'yellow', 'red', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('prospect', 'active', 'paused', 'churned');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('call', 'meeting', 'email', 'task', 'note');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'sent', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'sales', 'operations', 'finance', 'management');--> statement-breakpoint
CREATE TYPE "public"."ad_platform" AS ENUM('meta', 'google_ads');--> statement-breakpoint
CREATE TYPE "public"."sync_source" AS ENUM('alegra', 'clickup', 'windsor');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'success', 'error');--> statement-breakpoint
CREATE TABLE "account_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"monthly_fee" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'COP' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"clickup_list_id" text,
	"health" "project_health" DEFAULT 'unknown' NOT NULL,
	"synced_progress" jsonb,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_clickup_list_id_unique" UNIQUE("clickup_list_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_monthly_fee" numeric(14, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"nit" text,
	"industry" text,
	"website" text,
	"status" "account_status" DEFAULT 'prospect' NOT NULL,
	"owner_id" uuid,
	"alegra_contact_id" text,
	"clickup_folder_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_alegra_contact_id_unique" UNIQUE("alegra_contact_id"),
	CONSTRAINT "accounts_clickup_folder_id_unique" UNIQUE("clickup_folder_id")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "activity_type" NOT NULL,
	"subject" text NOT NULL,
	"content" text,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"deal_id" uuid,
	"contact_id" uuid,
	"account_id" uuid,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_target_check" CHECK ("activities"."deal_id" IS NOT NULL OR "activities"."contact_id" IS NOT NULL OR "activities"."account_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"job_title" text,
	"account_id" uuid,
	"owner_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"account_id" uuid NOT NULL,
	"contact_id" uuid,
	"stage_id" uuid NOT NULL,
	"owner_id" uuid,
	"amount" numeric(14, 2),
	"currency" text DEFAULT 'COP' NOT NULL,
	"expected_close_date" date,
	"position" integer DEFAULT 0 NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"is_won" boolean DEFAULT false NOT NULL,
	"is_lost" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pipeline_stages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"amount" numeric(14, 2),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_date" date NOT NULL,
	"pnl" jsonb,
	"cashflow" jsonb,
	"receivables" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_snapshots_snapshot_date_unique" UNIQUE("snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "synced_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_invoice_id" text NOT NULL,
	"number_full" text,
	"alegra_client_id" text,
	"account_id" uuid,
	"date" date,
	"due_date" date,
	"status" text,
	"stamp_legal_status" text,
	"subtotal" numeric(14, 2),
	"tax" numeric(14, 2),
	"total" numeric(14, 2),
	"total_paid" numeric(14, 2),
	"balance" numeric(14, 2),
	"currency_code" text DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(14, 4),
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_invoices_alegra_invoice_id_unique" UNIQUE("alegra_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "synced_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alegra_payment_id" text NOT NULL,
	"alegra_client_id" text,
	"account_id" uuid,
	"date" date,
	"amount" numeric(14, 2),
	"invoice_ids" jsonb,
	"bank_account" text,
	"cost_center" text,
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synced_payments_alegra_payment_id_unique" UNIQUE("alegra_payment_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"role" "user_role" DEFAULT 'sales' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "ad_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"platform" "ad_platform" NOT NULL,
	"external_account_id" text NOT NULL,
	"name" text NOT NULL,
	"account_currency" text DEFAULT 'COP' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "synced_campaign_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_account_id" uuid,
	"platform" "ad_platform" NOT NULL,
	"campaign_external_id" text NOT NULL,
	"campaign_name" text,
	"metric_date" date NOT NULL,
	"spend" numeric(14, 2),
	"clicks" integer,
	"impressions" integer,
	"cpc" numeric(14, 4),
	"cpm" numeric(14, 4),
	"ctr" numeric(10, 6),
	"reach" integer,
	"frequency" numeric(10, 4),
	"leads" integer,
	"cost_per_lead" numeric(14, 4),
	"purchases" integer,
	"purchase_value" numeric(14, 2),
	"roas" numeric(14, 4),
	"raw" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "sync_source" NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"error" text,
	"stats" jsonb
);
--> statement-breakpoint
ALTER TABLE "account_services" ADD CONSTRAINT "account_services_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_services" ADD CONSTRAINT "account_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synced_invoices" ADD CONSTRAINT "synced_invoices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synced_payments" ADD CONSTRAINT "synced_payments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synced_campaign_metrics" ADD CONSTRAINT "synced_campaign_metrics_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_metrics_platform_campaign_date_uq" ON "synced_campaign_metrics" USING btree ("platform","campaign_external_id","metric_date");