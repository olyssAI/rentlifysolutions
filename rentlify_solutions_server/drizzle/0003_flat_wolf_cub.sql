CREATE TABLE "location_menu_item_availability" (
	"location_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"price_override" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "location_menu_item_availability_location_id_menu_item_id_pk" PRIMARY KEY("location_id","menu_item_id"),
	CONSTRAINT "location_menu_item_price_check" CHECK ("location_menu_item_availability"."price_override" is null or "location_menu_item_availability"."price_override" >= 0)
);
--> statement-breakpoint
CREATE TABLE "menu_category" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_category_sort_order_check" CHECK ("menu_category"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"base_price" integer NOT NULL,
	"image_url" text,
	"image_public_id" text,
	"dietary_labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"calories" integer,
	"preparation_time_minutes" integer,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sold_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_item_price_check" CHECK ("menu_item"."base_price" >= 0),
	CONSTRAINT "menu_item_sort_order_check" CHECK ("menu_item"."sort_order" >= 0),
	CONSTRAINT "menu_item_calories_check" CHECK ("menu_item"."calories" is null or "menu_item"."calories" >= 0),
	CONSTRAINT "menu_item_preparation_time_check" CHECK ("menu_item"."preparation_time_minutes" is null or "menu_item"."preparation_time_minutes" between 1 and 480)
);
--> statement-breakpoint
CREATE TABLE "menu_item_modifier_group" (
	"menu_item_id" text NOT NULL,
	"modifier_group_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "menu_item_modifier_group_menu_item_id_modifier_group_id_pk" PRIMARY KEY("menu_item_id","modifier_group_id"),
	CONSTRAINT "menu_item_modifier_group_sort_order_check" CHECK ("menu_item_modifier_group"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "modifier_group" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"minimum_selections" integer DEFAULT 0 NOT NULL,
	"maximum_selections" integer DEFAULT 1 NOT NULL,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modifier_group_selection_check" CHECK ("modifier_group"."minimum_selections" >= 0 and "modifier_group"."maximum_selections" >= 1 and "modifier_group"."minimum_selections" <= "modifier_group"."maximum_selections"),
	CONSTRAINT "modifier_group_sort_order_check" CHECK ("modifier_group"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "modifier_option" (
	"id" text PRIMARY KEY NOT NULL,
	"modifier_group_id" text NOT NULL,
	"name" text NOT NULL,
	"price_adjustment" integer DEFAULT 0 NOT NULL,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_sold_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modifier_option_price_check" CHECK ("modifier_option"."price_adjustment" >= 0),
	CONSTRAINT "modifier_option_sort_order_check" CHECK ("modifier_option"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "published_menu" (
	"restaurant_id" text PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"snapshot" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location_menu_item_availability" ADD CONSTRAINT "location_menu_item_availability_location_id_restaurant_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."restaurant_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_menu_item_availability" ADD CONSTRAINT "location_menu_item_availability_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_id_menu_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_modifier_group_id_modifier_group_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD CONSTRAINT "modifier_group_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD CONSTRAINT "modifier_option_modifier_group_id_modifier_group_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_menu" ADD CONSTRAINT "published_menu_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_category_restaurant_id_idx" ON "menu_category" USING btree ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_category_restaurant_name_unique" ON "menu_category" USING btree ("restaurant_id","name");--> statement-breakpoint
CREATE INDEX "menu_item_restaurant_id_idx" ON "menu_item" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "menu_item_category_id_idx" ON "menu_item" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "modifier_group_restaurant_id_idx" ON "modifier_group" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "modifier_option_group_id_idx" ON "modifier_option" USING btree ("modifier_group_id");