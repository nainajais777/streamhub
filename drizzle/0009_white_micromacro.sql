CREATE TABLE "pending_checkouts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pending_checkouts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"order_id" varchar(255) NOT NULL,
	"subscriber_id" bigint NOT NULL,
	"creator_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_checkouts_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_stripe_event_id_unique";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_event_id" varchar(255);--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD CONSTRAINT "pending_checkouts_subscriber_id_users_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD CONSTRAINT "pending_checkouts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripe_event_id";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_event_id_unique" UNIQUE("gateway_event_id");