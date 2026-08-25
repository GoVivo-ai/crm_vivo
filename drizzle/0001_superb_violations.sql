CREATE TYPE "public"."integration_type" AS ENUM('alegra', 'windsor', 'clickup');--> statement-breakpoint
CREATE TYPE "public"."integration_test_status" AS ENUM('ok', 'failed');--> statement-breakpoint
CREATE TABLE "integration_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration" "integration_type" NOT NULL,
	"payload_encrypted" text NOT NULL,
	"configured_by" uuid,
	"configured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_test_status" "integration_test_status",
	"last_test_at" timestamp with time zone,
	"last_test_error" text,
	CONSTRAINT "integration_credentials_integration_unique" UNIQUE("integration")
);
--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_configured_by_users_id_fk" FOREIGN KEY ("configured_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;