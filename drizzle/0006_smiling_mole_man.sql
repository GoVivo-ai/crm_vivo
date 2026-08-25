ALTER TABLE "integration_credentials" ALTER COLUMN "integration" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."integration_type";--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('alegra', 'meta_ads', 'clickup');--> statement-breakpoint
ALTER TABLE "integration_credentials" ALTER COLUMN "integration" SET DATA TYPE "public"."integration_type" USING "integration"::"public"."integration_type";--> statement-breakpoint
ALTER TABLE "sync_runs" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."sync_source";--> statement-breakpoint
CREATE TYPE "public"."sync_source" AS ENUM('alegra', 'clickup', 'meta_ads');--> statement-breakpoint
ALTER TABLE "sync_runs" ALTER COLUMN "source" SET DATA TYPE "public"."sync_source" USING "source"::"public"."sync_source";--> statement-breakpoint
ALTER TABLE "synced_employees" DROP COLUMN "birthday";