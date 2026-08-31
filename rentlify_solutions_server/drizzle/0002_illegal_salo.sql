CREATE TABLE "delivery_zone" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"delivery_fee" integer DEFAULT 0 NOT NULL,
	"minimum_order_amount" integer DEFAULT 0 NOT NULL,
	"free_delivery_threshold" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_zone_type_check" CHECK ("delivery_zone"."type" in ('POSTAL_CODE', 'RADIUS')),
	CONSTRAINT "delivery_zone_money_check" CHECK ("delivery_zone"."delivery_fee" >= 0 and "delivery_zone"."minimum_order_amount" >= 0 and ("delivery_zone"."free_delivery_threshold" is null or "delivery_zone"."free_delivery_threshold" >= 0))
);
--> statement-breakpoint
CREATE TABLE "location_opening_hour" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"fulfillment_type" text NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "location_opening_hour_day_check" CHECK ("location_opening_hour"."day_of_week" between 0 and 6),
	CONSTRAINT "location_opening_hour_fulfillment_check" CHECK ("location_opening_hour"."fulfillment_type" in ('DELIVERY', 'PICKUP', 'DINE_IN')),
	CONSTRAINT "location_opening_hour_range_check" CHECK ("location_opening_hour"."opens_at" <> "location_opening_hour"."closes_at")
);
--> statement-breakpoint
CREATE TABLE "location_special_hour" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"date" date NOT NULL,
	"fulfillment_type" text NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"opens_at" time,
	"closes_at" time,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "location_special_hour_fulfillment_check" CHECK ("location_special_hour"."fulfillment_type" in ('DELIVERY', 'PICKUP', 'DINE_IN')),
	CONSTRAINT "location_special_hour_times_check" CHECK (("location_special_hour"."is_closed" and "location_special_hour"."opens_at" is null and "location_special_hour"."closes_at" is null) or (not "location_special_hour"."is_closed" and "location_special_hour"."opens_at" is not null and "location_special_hour"."closes_at" is not null and "location_special_hour"."opens_at" <> "location_special_hour"."closes_at"))
);
--> statement-breakpoint
CREATE TABLE "package_feature" (
	"package_id" text NOT NULL,
	"feature_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "package_feature_package_id_feature_key_pk" PRIMARY KEY("package_id","feature_key"),
	CONSTRAINT "package_feature_key_check" CHECK ("package_feature"."feature_key" in ('ONLINE_ORDERING', 'DELIVERY', 'PICKUP', 'DINE_IN', 'SCHEDULED_ORDERS', 'MULTI_LOCATION', 'MENU_CUSTOMIZATIONS', 'ALLERGENS_AND_DIETARY_LABELS', 'COUPONS', 'LOYALTY', 'PUSH_NOTIFICATIONS', 'ORDER_TRACKING', 'CUSTOM_BRANDING', 'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS', 'ADVANCED_DELIVERY_ZONES', 'TABLE_ORDERING', 'CUSTOMER_ACCOUNTS', 'GUEST_CHECKOUT', 'ONLINE_PAYMENTS', 'CASH_ON_DELIVERY'))
);
--> statement-breakpoint
CREATE TABLE "restaurant" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text,
	"description" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"package_id" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"country_code" text DEFAULT 'PK' NOT NULL,
	"currency_code" text DEFAULT 'PKR' NOT NULL,
	"timezone" text DEFAULT 'Asia/Karachi' NOT NULL,
	"logo_url" text,
	"cover_image_url" text,
	"primary_color" text DEFAULT '#D92D20' NOT NULL,
	"accent_color" text DEFAULT '#F7C948' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_status_check" CHECK ("restaurant"."status" in ('DRAFT', 'ACTIVE', 'SUSPENDED'))
);
--> statement-breakpoint
CREATE TABLE "restaurant_feature_override" (
	"restaurant_id" text NOT NULL,
	"feature_key" text NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_feature_override_restaurant_id_feature_key_pk" PRIMARY KEY("restaurant_id","feature_key"),
	CONSTRAINT "restaurant_feature_override_key_check" CHECK ("restaurant_feature_override"."feature_key" in ('ONLINE_ORDERING', 'DELIVERY', 'PICKUP', 'DINE_IN', 'SCHEDULED_ORDERS', 'MULTI_LOCATION', 'MENU_CUSTOMIZATIONS', 'ALLERGENS_AND_DIETARY_LABELS', 'COUPONS', 'LOYALTY', 'PUSH_NOTIFICATIONS', 'ORDER_TRACKING', 'CUSTOM_BRANDING', 'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS', 'ADVANCED_DELIVERY_ZONES', 'TABLE_ORDERING', 'CUSTOMER_ACCOUNTS', 'GUEST_CHECKOUT', 'ONLINE_PAYMENTS', 'CASH_ON_DELIVERY'))
);
--> statement-breakpoint
CREATE TABLE "restaurant_location" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text,
	"latitude" text,
	"longitude" text,
	"preparation_time_minutes" integer DEFAULT 30 NOT NULL,
	"order_capacity_per_slot" integer DEFAULT 20 NOT NULL,
	"delivery_enabled" boolean DEFAULT true NOT NULL,
	"pickup_enabled" boolean DEFAULT true NOT NULL,
	"dine_in_enabled" boolean DEFAULT true NOT NULL,
	"scheduled_orders_enabled" boolean DEFAULT true NOT NULL,
	"minimum_order_amount" integer DEFAULT 0 NOT NULL,
	"delivery_fee" integer DEFAULT 0 NOT NULL,
	"free_delivery_threshold" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_location_status_check" CHECK ("restaurant_location"."status" in ('DRAFT', 'ACTIVE', 'SUSPENDED')),
	CONSTRAINT "restaurant_location_preparation_time_check" CHECK ("restaurant_location"."preparation_time_minutes" between 1 and 480),
	CONSTRAINT "restaurant_location_order_capacity_check" CHECK ("restaurant_location"."order_capacity_per_slot" between 1 and 10000),
	CONSTRAINT "restaurant_location_money_check" CHECK ("restaurant_location"."minimum_order_amount" >= 0 and "restaurant_location"."delivery_fee" >= 0 and ("restaurant_location"."free_delivery_threshold" is null or "restaurant_location"."free_delivery_threshold" >= 0))
);
--> statement-breakpoint
CREATE TABLE "subscription_package" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_package_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "delivery_zone" ADD CONSTRAINT "delivery_zone_location_id_restaurant_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."restaurant_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_opening_hour" ADD CONSTRAINT "location_opening_hour_location_id_restaurant_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."restaurant_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_special_hour" ADD CONSTRAINT "location_special_hour_location_id_restaurant_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."restaurant_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_feature" ADD CONSTRAINT "package_feature_package_id_subscription_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."subscription_package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_package_id_subscription_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."subscription_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_feature_override" ADD CONSTRAINT "restaurant_feature_override_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD CONSTRAINT "restaurant_location_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_zone_location_id_idx" ON "delivery_zone" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "location_opening_hour_location_id_idx" ON "location_opening_hour" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "location_special_hour_location_id_idx" ON "location_special_hour" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_slug_unique" ON "restaurant" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "restaurant_package_id_idx" ON "restaurant" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "restaurant_status_idx" ON "restaurant" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_location_restaurant_slug_unique" ON "restaurant_location" USING btree ("restaurant_id","slug");--> statement-breakpoint
CREATE INDEX "restaurant_location_restaurant_id_idx" ON "restaurant_location" USING btree ("restaurant_id");