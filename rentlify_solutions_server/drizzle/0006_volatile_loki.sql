DO $$
BEGIN
	IF EXISTS (
		SELECT lower("email")
		FROM "user"
		GROUP BY lower("email")
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot enforce case-insensitive email uniqueness: duplicate user emails exist.';
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "user"
		WHERE "role" NOT IN ('PLATFORM_USER', 'RESTAURANT_OWNER', 'SUPER_ADMIN')
	) THEN
		RAISE EXCEPTION 'Cannot enforce the user role constraint: unsupported user roles exist.';
	END IF;
END
$$;
--> statement-breakpoint
CREATE TABLE "restaurant_membership" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"membership_role" text DEFAULT 'OWNER' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_membership_role_check" CHECK ("restaurant_membership"."membership_role" in ('OWNER'))
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "restaurant_membership" ADD CONSTRAINT "restaurant_membership_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_membership" ADD CONSTRAINT "restaurant_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_membership_restaurant_user_unique" ON "restaurant_membership" USING btree ("restaurant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_membership_user_id_unique" ON "restaurant_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "restaurant_membership_restaurant_id_idx" ON "restaurant_membership" USING btree ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_membership_one_primary_per_restaurant_unique" ON "restaurant_membership" USING btree ("restaurant_id") WHERE "restaurant_membership"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_lower_unique" ON "user" USING btree (lower("email"));--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK ("user"."role" in ('PLATFORM_USER', 'RESTAURANT_OWNER', 'SUPER_ADMIN'));
