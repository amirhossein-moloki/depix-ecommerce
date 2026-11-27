import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261127211500_StorePublicIdentitySettings extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE IF EXISTS "store_setting"
        ADD COLUMN IF NOT EXISTS "logo_id" text NULL,
        ADD COLUMN IF NOT EXISTS "logo_url" text NULL,
        ADD COLUMN IF NOT EXISTS "brand_description" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "contact_phones" jsonb NULL,
        ADD COLUMN IF NOT EXISTS "social_links" jsonb NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE IF EXISTS "store_setting"
        DROP COLUMN IF EXISTS "logo_id",
        DROP COLUMN IF EXISTS "logo_url",
        DROP COLUMN IF EXISTS "brand_description",
        DROP COLUMN IF EXISTS "contact_phones",
        DROP COLUMN IF EXISTS "social_links";
    `)
  }
}
