CREATE TABLE "api_request_throttle" (
	"throttle_key" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_request_throttle_count_check" CHECK ("api_request_throttle"."request_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX "api_request_throttle_window_started_at_index" ON "api_request_throttle" USING btree ("window_started_at");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "menu_item"
		WHERE NOT (
			"allergens" <@ array['CELERY', 'CRUSTACEANS', 'EGGS', 'FISH', 'GLUTEN', 'LUPIN', 'MILK', 'MOLLUSCS', 'MUSTARD', 'NUTS', 'PEANUTS', 'SESAME', 'SOYBEANS', 'SULPHITES']::text[]
		)
	) THEN
		RAISE EXCEPTION 'Cannot constrain menu_item.allergens: existing rows contain values outside the controlled allergen vocabulary. Review and migrate those values deliberately before retrying.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "menu_item"
		WHERE NOT (
			"dietary_labels" <@ array['VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'SPICY', 'CONTAINS_ALCOHOL']::text[]
		)
	) THEN
		RAISE EXCEPTION 'Cannot constrain menu_item.dietary_labels: existing rows contain values outside the controlled dietary-label vocabulary. Review and migrate those values deliberately before retrying.';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_allergens_check" CHECK ("menu_item"."allergens" <@ array['CELERY', 'CRUSTACEANS', 'EGGS', 'FISH', 'GLUTEN', 'LUPIN', 'MILK', 'MOLLUSCS', 'MUSTARD', 'NUTS', 'PEANUTS', 'SESAME', 'SOYBEANS', 'SULPHITES']::text[]);--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_dietary_labels_check" CHECK ("menu_item"."dietary_labels" <@ array['VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'SPICY', 'CONTAINS_ALCOHOL']::text[]);
