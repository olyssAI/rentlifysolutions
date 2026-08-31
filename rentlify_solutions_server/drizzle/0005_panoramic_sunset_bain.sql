CREATE TABLE "published_menu_version" (
	"restaurant_id" text NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_menu_version_restaurant_id_version_pk" PRIMARY KEY("restaurant_id","version"),
	CONSTRAINT "published_menu_version_number_check" CHECK ("published_menu_version"."version" >= 1)
);
--> statement-breakpoint
DROP INDEX "menu_category_restaurant_name_unique";--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "image_public_id" text;--> statement-breakpoint
ALTER TABLE "published_menu_version" ADD CONSTRAINT "published_menu_version_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "published_menu_version_restaurant_published_at_idx" ON "published_menu_version" USING btree ("restaurant_id","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_category_restaurant_name_unique" ON "menu_category" USING btree ("restaurant_id",lower("name"));