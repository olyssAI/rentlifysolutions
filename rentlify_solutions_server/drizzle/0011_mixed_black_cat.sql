DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "user"
		WHERE "role" NOT IN ('CUSTOMER', 'PLATFORM_USER', 'RESTAURANT_OWNER', 'SUPER_ADMIN')
	) THEN
		RAISE EXCEPTION 'Cannot replace the user role constraint: unsupported user roles exist.';
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "package_feature"
		WHERE "feature_key" NOT IN ('ONLINE_ORDERING', 'DELIVERY', 'PICKUP', 'DINE_IN', 'SCHEDULED_ORDERS', 'MULTI_LOCATION', 'MENU_CUSTOMIZATIONS', 'ALLERGENS_AND_DIETARY_LABELS', 'CUSTOM_BRANDING', 'ADVANCED_DELIVERY_ZONES', 'CUSTOMER_ACCOUNTS', 'CASH_ON_DELIVERY', 'COUPONS', 'LOYALTY', 'PUSH_NOTIFICATIONS', 'ORDER_TRACKING', 'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS', 'TABLE_ORDERING', 'GUEST_CHECKOUT', 'ONLINE_PAYMENTS')
	) THEN
		RAISE EXCEPTION 'Cannot replace the package feature constraint: unsupported feature keys exist.';
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "restaurant_feature_override"
		WHERE "feature_key" NOT IN ('ONLINE_ORDERING', 'DELIVERY', 'PICKUP', 'DINE_IN', 'SCHEDULED_ORDERS', 'MULTI_LOCATION', 'MENU_CUSTOMIZATIONS', 'ALLERGENS_AND_DIETARY_LABELS', 'CUSTOM_BRANDING', 'ADVANCED_DELIVERY_ZONES', 'CUSTOMER_ACCOUNTS', 'CASH_ON_DELIVERY', 'COUPONS', 'LOYALTY', 'PUSH_NOTIFICATIONS', 'ORDER_TRACKING', 'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS', 'TABLE_ORDERING', 'GUEST_CHECKOUT', 'ONLINE_PAYMENTS')
	) THEN
		RAISE EXCEPTION 'Cannot replace the restaurant feature override constraint: unsupported feature keys exist.';
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "restaurant"
		WHERE "timezone" IS DISTINCT FROM 'Asia/Karachi'
	) THEN
		RAISE EXCEPTION 'Cannot enforce the restaurant timezone constraint: non-Asia/Karachi values exist.';
	END IF;
END
$$;
--> statement-breakpoint
CREATE TABLE "customer_order" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"location_id" text NOT NULL,
	"customer_user_id" text,
	"idempotency_key" text NOT NULL,
	"order_number" integer NOT NULL,
	"status" text DEFAULT 'PLACED' NOT NULL,
	"fulfillment_type" text NOT NULL,
	"payment_method" text DEFAULT 'CASH' NOT NULL,
	"currency_code" text NOT NULL,
	"menu_version" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"delivery_fee" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"delivery_address" jsonb,
	"customer_note" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_by_user_id" text,
	"archive_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_order_status_check" CHECK ("customer_order"."status" in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
	CONSTRAINT "customer_order_fulfillment_check" CHECK ("customer_order"."fulfillment_type" in ('DELIVERY', 'PICKUP')),
	CONSTRAINT "customer_order_payment_method_check" CHECK ("customer_order"."payment_method" = 'CASH'),
	CONSTRAINT "customer_order_currency_check" CHECK ("customer_order"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "customer_order_menu_version_check" CHECK ("customer_order"."menu_version" >= 1),
	CONSTRAINT "customer_order_number_check" CHECK ("customer_order"."order_number" >= 1),
	CONSTRAINT "customer_order_totals_check" CHECK ("customer_order"."subtotal" >= 0 and "customer_order"."delivery_fee" >= 0 and "customer_order"."total" = "customer_order"."subtotal" + "customer_order"."delivery_fee"),
	CONSTRAINT "customer_order_delivery_address_check" CHECK (("customer_order"."fulfillment_type" = 'DELIVERY' and "customer_order"."delivery_address" is not null and jsonb_typeof("customer_order"."delivery_address") = 'object') or ("customer_order"."fulfillment_type" = 'PICKUP' and "customer_order"."delivery_address" is null))
);
--> statement-breakpoint
CREATE TABLE "customer_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text,
	"item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"modifier_unit_total" integer DEFAULT 0 NOT NULL,
	"line_total" integer NOT NULL,
	"modifiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_order_item_quantity_check" CHECK ("customer_order_item"."quantity" between 1 and 50),
	CONSTRAINT "customer_order_item_money_check" CHECK ("customer_order_item"."unit_price" >= 0 and "customer_order_item"."modifier_unit_total" >= 0 and "customer_order_item"."line_total" = ("customer_order_item"."unit_price" + "customer_order_item"."modifier_unit_total") * "customer_order_item"."quantity"),
	CONSTRAINT "customer_order_item_modifiers_check" CHECK (jsonb_typeof("customer_order_item"."modifiers") = 'array')
);
--> statement-breakpoint
CREATE TABLE "customer_order_status_event" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_user_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_order_status_event_from_check" CHECK ("customer_order_status_event"."from_status" is null or "customer_order_status_event"."from_status" in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
	CONSTRAINT "customer_order_status_event_to_check" CHECK ("customer_order_status_event"."to_status" in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'))
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_role_check";--> statement-breakpoint
ALTER TABLE "package_feature" DROP CONSTRAINT "package_feature_key_check";--> statement-breakpoint
ALTER TABLE "restaurant_feature_override" DROP CONSTRAINT "restaurant_feature_override_key_check";--> statement-breakpoint
ALTER TABLE "delivery_zone" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "delivery_zone" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "delivery_zone" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "restaurant_membership" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "restaurant_membership" ADD COLUMN "archived_by_user_id" text;--> statement-breakpoint
ALTER TABLE "restaurant_membership" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_customer_user_id_user_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_location_restaurant_fk" FOREIGN KEY ("location_id","restaurant_id") REFERENCES "public"."restaurant_location"("id","restaurant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_item" ADD CONSTRAINT "customer_order_item_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_item" ADD CONSTRAINT "customer_order_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_status_event" ADD CONSTRAINT "customer_order_status_event_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_status_event" ADD CONSTRAINT "customer_order_status_event_changed_by_user_id_user_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_order_restaurant_number_unique" ON "customer_order" USING btree ("restaurant_id","order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_order_restaurant_customer_idempotency_unique" ON "customer_order" USING btree ("restaurant_id","customer_user_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_order_id_restaurant_unique" ON "customer_order" USING btree ("id","restaurant_id");--> statement-breakpoint
CREATE INDEX "customer_order_customer_placed_at_idx" ON "customer_order" USING btree ("customer_user_id","placed_at");--> statement-breakpoint
CREATE INDEX "customer_order_restaurant_status_placed_at_idx" ON "customer_order" USING btree ("restaurant_id","status","placed_at");--> statement-breakpoint
CREATE INDEX "customer_order_item_order_id_idx" ON "customer_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "customer_order_status_event_order_created_idx" ON "customer_order_status_event" USING btree ("order_id","created_at");--> statement-breakpoint
ALTER TABLE "delivery_zone" ADD CONSTRAINT "delivery_zone_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD CONSTRAINT "modifier_group_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD CONSTRAINT "modifier_option_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_location" ADD CONSTRAINT "restaurant_location_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_membership" ADD CONSTRAINT "restaurant_membership_archived_by_user_id_user_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK ("user"."role" in ('CUSTOMER', 'PLATFORM_USER', 'RESTAURANT_OWNER', 'SUPER_ADMIN'));--> statement-breakpoint
ALTER TABLE "package_feature" ADD CONSTRAINT "package_feature_key_check" CHECK ("package_feature"."feature_key" in ('ONLINE_ORDERING', 'DELIVERY', 'PICKUP', 'DINE_IN', 'SCHEDULED_ORDERS', 'MULTI_LOCATION', 'MENU_CUSTOMIZATIONS', 'ALLERGENS_AND_DIETARY_LABELS', 'CUSTOM_BRANDING', 'ADVANCED_DELIVERY_ZONES', 'CUSTOMER_ACCOUNTS', 'CASH_ON_DELIVERY', 'COUPONS', 'LOYALTY', 'PUSH_NOTIFICATIONS', 'ORDER_TRACKING', 'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS', 'TABLE_ORDERING', 'GUEST_CHECKOUT', 'ONLINE_PAYMENTS'));--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_timezone_check" CHECK ("restaurant"."timezone" = 'Asia/Karachi');--> statement-breakpoint
ALTER TABLE "restaurant_feature_override" ADD CONSTRAINT "restaurant_feature_override_key_check" CHECK ("restaurant_feature_override"."feature_key" in ('ONLINE_ORDERING', 'DELIVERY', 'PICKUP', 'DINE_IN', 'SCHEDULED_ORDERS', 'MULTI_LOCATION', 'MENU_CUSTOMIZATIONS', 'ALLERGENS_AND_DIETARY_LABELS', 'CUSTOM_BRANDING', 'ADVANCED_DELIVERY_ZONES', 'CUSTOMER_ACCOUNTS', 'CASH_ON_DELIVERY', 'COUPONS', 'LOYALTY', 'PUSH_NOTIFICATIONS', 'ORDER_TRACKING', 'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS', 'TABLE_ORDERING', 'GUEST_CHECKOUT', 'ONLINE_PAYMENTS'));
