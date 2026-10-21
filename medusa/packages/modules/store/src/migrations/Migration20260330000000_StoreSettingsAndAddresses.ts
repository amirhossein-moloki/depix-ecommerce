import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260330000000_StoreSettingsAndAddresses extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "store_setting" (
        "id" text NOT NULL,
        "store_id" text NULL,
        "store_name" text NOT NULL DEFAULT 'Mepusham',
        "contact_phone" text NOT NULL DEFAULT '',
        "support_email" text NOT NULL DEFAULT '',
        "address" text NULL,
        "tax_rate" numeric NOT NULL DEFAULT 0,
        "enable_sms_notifications" boolean NOT NULL DEFAULT true,
        "enable_email_notifications" boolean NOT NULL DEFAULT true,
        "return_window_days" integer NOT NULL DEFAULT 2,
        "auto_approve_returns" boolean NOT NULL DEFAULT false,
        "default_shipping_address_id" text NULL,
        "default_return_address_id" text NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "PK_store_setting_id" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "store_address" (
        "id" text NOT NULL,
        "store_id" text NULL,
        "title" text NOT NULL,
        "recipient_name" text NOT NULL,
        "phone" text NOT NULL,
        "province" text NOT NULL,
        "city" text NOT NULL,
        "address" text NOT NULL,
        "plaque" text NULL,
        "floor" text NULL,
        "postal_code" text NOT NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "PK_store_address_id" PRIMARY KEY ("id")
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "store_setting" CASCADE;')
    this.addSql('DROP TABLE IF EXISTS "store_address" CASCADE;')
  }
}
