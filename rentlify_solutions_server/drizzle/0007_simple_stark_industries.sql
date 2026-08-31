CREATE TABLE "restaurant_owner_provisioning" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"normalized_email" text NOT NULL,
	"created_user_id" text,
	"state" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_owner_provisioning_email_normalized_check" CHECK ("restaurant_owner_provisioning"."normalized_email" = lower("restaurant_owner_provisioning"."normalized_email")),
	CONSTRAINT "restaurant_owner_provisioning_state_check" CHECK ("restaurant_owner_provisioning"."state" in ('PENDING', 'COMPLETED'))
);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "restaurant_location"
		WHERE ("latitude" IS NOT NULL AND "latitude" !~ '^-?(90(\.0{1,6})?|[0-8]?[0-9](\.[0-9]{1,6})?)$')
			OR ("longitude" IS NOT NULL AND "longitude" !~ '^-?(180(\.0{1,6})?|1[0-7][0-9](\.[0-9]{1,6})?|[0-9]?[0-9](\.[0-9]{1,6})?)$')
	) THEN
		RAISE EXCEPTION 'Migration blocked: restaurant locations contain invalid or over-precision coordinates.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "location_opening_hour"
		GROUP BY "location_id", "day_of_week", "fulfillment_type"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Migration blocked: duplicate weekly opening-hour schedules exist.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "location_special_hour"
		GROUP BY "location_id", "date", "fulfillment_type"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Migration blocked: duplicate special-hour schedules exist.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "delivery_zone"
		WHERE jsonb_typeof("configuration") <> 'object'
			OR ("type" = 'POSTAL_CODE' AND (
				jsonb_typeof("configuration"->'postalCodes') <> 'array'
				OR jsonb_array_length("configuration"->'postalCodes') = 0
			))
			OR ("type" = 'RADIUS' AND (
				jsonb_typeof("configuration"->'radiusKilometers') <> 'number'
				OR (("configuration"->>'radiusKilometers')::numeric) <= 0
				OR (("configuration"->>'radiusKilometers')::numeric) > 200
			))
	) THEN
		RAISE EXCEPTION 'Migration blocked: delivery zones contain invalid configuration data.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "restaurant"
		WHERE "primary_color" !~ '^#[0-9A-Fa-f]{6}$'
			OR "accent_color" !~ '^#[0-9A-Fa-f]{6}$'
			OR ("logo_url" IS NOT NULL AND "logo_url" !~ '^https://')
			OR ("cover_image_url" IS NOT NULL AND "cover_image_url" !~ '^https://')
	) THEN
		RAISE EXCEPTION 'Migration blocked: restaurant branding contains invalid colors or non-HTTPS media URLs.';
	END IF;
END $$;
--> statement-breakpoint
DROP INDEX "restaurant_membership_user_id_unique";--> statement-breakpoint
ALTER TABLE "restaurant_location" ALTER COLUMN "latitude" SET DATA TYPE numeric(9, 6) USING "latitude"::numeric(9, 6);--> statement-breakpoint
ALTER TABLE "restaurant_location" ALTER COLUMN "longitude" SET DATA TYPE numeric(10, 6) USING "longitude"::numeric(10, 6);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_change_recommended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "package_feature" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "package_feature" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant_owner_provisioning" ADD CONSTRAINT "restaurant_owner_provisioning_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_owner_provisioning" ADD CONSTRAINT "restaurant_owner_provisioning_created_user_id_user_id_fk" FOREIGN KEY ("created_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_owner_provisioning_restaurant_unique" ON "restaurant_owner_provisioning" USING btree ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_owner_provisioning_email_unique" ON "restaurant_owner_provisioning" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "location_opening_hour_schedule_unique" ON "location_opening_hour" USING btree ("location_id","day_of_week","fulfillment_type");--> statement-breakpoint
CREATE UNIQUE INDEX "location_special_hour_schedule_unique" ON "location_special_hour" USING btree ("location_id","date","fulfillment_type");--> statement-breakpoint
CREATE INDEX "restaurant_membership_user_id_idx" ON "restaurant_membership" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "delivery_zone" ADD CONSTRAINT "delivery_zone_configuration_check" CHECK (jsonb_typeof("delivery_zone"."configuration") = 'object' and (("delivery_zone"."type" = 'POSTAL_CODE' and jsonb_typeof("delivery_zone"."configuration"->'postalCodes') = 'array' and jsonb_array_length("delivery_zone"."configuration"->'postalCodes') > 0) or ("delivery_zone"."type" = 'RADIUS' and jsonb_typeof("delivery_zone"."configuration"->'radiusKilometers') = 'number' and (("delivery_zone"."configuration"->>'radiusKilometers')::numeric) > 0 and (("delivery_zone"."configuration"->>'radiusKilometers')::numeric) <= 200)));--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_primary_color_check" CHECK ("restaurant"."primary_color" ~ '^#[0-9A-Fa-f]{6}$');--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_accent_color_check" CHECK ("restaurant"."accent_color" ~ '^#[0-9A-Fa-f]{6}$');--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_logo_url_check" CHECK ("restaurant"."logo_url" is null or "restaurant"."logo_url" ~ '^https://');--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_cover_image_url_check" CHECK ("restaurant"."cover_image_url" is null or "restaurant"."cover_image_url" ~ '^https://');--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD CONSTRAINT "restaurant_location_latitude_check" CHECK ("restaurant_location"."latitude" is null or "restaurant_location"."latitude" between -90 and 90);--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD CONSTRAINT "restaurant_location_longitude_check" CHECK ("restaurant_location"."longitude" is null or "restaurant_location"."longitude" between -180 and 180);
