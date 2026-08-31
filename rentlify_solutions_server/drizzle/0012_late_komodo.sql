CREATE TABLE "contact_enquiry" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"business_name" text NOT NULL,
	"industry" text NOT NULL,
	"help_type" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_enquiry_name_length_check" CHECK (char_length("contact_enquiry"."name") between 2 and 100),
	CONSTRAINT "contact_enquiry_email_length_check" CHECK (char_length("contact_enquiry"."email") between 3 and 254),
	CONSTRAINT "contact_enquiry_email_normalized_check" CHECK ("contact_enquiry"."email" = lower("contact_enquiry"."email")),
	CONSTRAINT "contact_enquiry_phone_length_check" CHECK ("contact_enquiry"."phone" is null or char_length("contact_enquiry"."phone") between 7 and 30),
	CONSTRAINT "contact_enquiry_business_name_length_check" CHECK (char_length("contact_enquiry"."business_name") between 2 and 120),
	CONSTRAINT "contact_enquiry_industry_check" CHECK ("contact_enquiry"."industry" in ('RESTAURANT', 'CLINIC', 'GYM', 'ACADEMY', 'RETAIL', 'SALON', 'OTHER')),
	CONSTRAINT "contact_enquiry_help_type_check" CHECK ("contact_enquiry"."help_type" in ('MOBILE_APP', 'WEBSITE', 'BUSINESS_SOFTWARE', 'COMPLETE_SOLUTION', 'NOT_SURE')),
	CONSTRAINT "contact_enquiry_message_length_check" CHECK (char_length("contact_enquiry"."message") between 30 and 2000),
	CONSTRAINT "contact_enquiry_status_check" CHECK ("contact_enquiry"."status" in ('NEW', 'REVIEWED', 'CONTACTED', 'CLOSED'))
);
--> statement-breakpoint
CREATE INDEX "contact_enquiry_status_created_at_idx" ON "contact_enquiry" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_enquiry_email_created_at_idx" ON "contact_enquiry" USING btree ("email","created_at");