import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261125151625 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "promotion_free_shipping_rule" ("id" text not null, "title" text not null, "scope" text check ("scope" in ('store', 'products', 'categories', 'campaign')) not null default 'store', "product_ids" jsonb null, "category_ids" jsonb null, "campaign_id" text null, "min_purchase_amount" numeric null, "starts_at" timestamptz null, "ends_at" timestamptz null, "is_active" boolean not null default true, "metadata" jsonb null, "raw_min_purchase_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_free_shipping_rule_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_promotion_free_shipping_rule_deleted_at" ON "promotion_free_shipping_rule" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_free_shipping_rule_is_active" ON "promotion_free_shipping_rule" ("is_active") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_free_shipping_rule_scope" ON "promotion_free_shipping_rule" ("scope") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "promotion_free_shipping_rule" cascade;`)
  }
}
