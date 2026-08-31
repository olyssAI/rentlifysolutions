CREATE TABLE "menu_media_upload_intent" (
	"public_id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"requested_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"attached_at" timestamp with time zone,
	"cleaned_at" timestamp with time zone,
	"cleanup_attempted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_media_upload_intent_state_check" CHECK (not ("menu_media_upload_intent"."attached_at" is not null and "menu_media_upload_intent"."cleaned_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "menu_media_upload_intent" ADD CONSTRAINT "menu_media_upload_intent_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_media_upload_intent" ADD CONSTRAINT "menu_media_upload_intent_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_media_upload_intent_restaurant_user_created_index" ON "menu_media_upload_intent" USING btree ("restaurant_id","requested_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "menu_media_upload_intent_cleanup_index" ON "menu_media_upload_intent" USING btree ("expires_at") WHERE "menu_media_upload_intent"."attached_at" is null and "menu_media_upload_intent"."cleaned_at" is null;