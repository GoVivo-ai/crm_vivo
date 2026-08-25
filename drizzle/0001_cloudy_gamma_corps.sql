CREATE TYPE "public"."contract_type" AS ENUM('termino_fijo', 'indefinido', 'prestacion_servicios', 'obra_labor');--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "contract_type" SET DATA TYPE "public"."contract_type" USING "contract_type"::"public"."contract_type";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "base_salary_currency" text DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "work_schedule" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "eps" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "afp" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "arl" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "caja_compensacion" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "blood_type" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "shirt_size" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "pants_size" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "shoe_size" text;