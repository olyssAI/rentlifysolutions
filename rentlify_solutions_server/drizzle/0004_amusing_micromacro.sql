ALTER TABLE "location_menu_item_availability" DROP CONSTRAINT "location_menu_item_availability_location_id_restaurant_location_id_fk";
--> statement-breakpoint
ALTER TABLE "location_menu_item_availability" DROP CONSTRAINT "location_menu_item_availability_menu_item_id_menu_item_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item" DROP CONSTRAINT "menu_item_category_id_menu_category_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" DROP CONSTRAINT "menu_item_modifier_group_modifier_group_id_modifier_group_id_fk";
--> statement-breakpoint
ALTER TABLE "location_menu_item_availability" ADD COLUMN "restaurant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD COLUMN "restaurant_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "menu_category_id_restaurant_unique" ON "menu_category" USING btree ("id","restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_item_id_restaurant_unique" ON "menu_item" USING btree ("id","restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modifier_group_id_restaurant_unique" ON "modifier_group" USING btree ("id","restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_location_id_restaurant_unique" ON "restaurant_location" USING btree ("id","restaurant_id");--> statement-breakpoint
ALTER TABLE "location_menu_item_availability" ADD CONSTRAINT "location_menu_item_availability_location_restaurant_fk" FOREIGN KEY ("location_id","restaurant_id") REFERENCES "public"."restaurant_location"("id","restaurant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_menu_item_availability" ADD CONSTRAINT "location_menu_item_availability_item_restaurant_fk" FOREIGN KEY ("menu_item_id","restaurant_id") REFERENCES "public"."menu_item"("id","restaurant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_restaurant_fk" FOREIGN KEY ("category_id","restaurant_id") REFERENCES "public"."menu_category"("id","restaurant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_item_restaurant_fk" FOREIGN KEY ("menu_item_id","restaurant_id") REFERENCES "public"."menu_item"("id","restaurant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_group_restaurant_fk" FOREIGN KEY ("modifier_group_id","restaurant_id") REFERENCES "public"."modifier_group"("id","restaurant_id") ON DELETE cascade ON UPDATE no action;
