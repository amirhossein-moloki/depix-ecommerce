import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151827 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "price_alert" ("id" text not null, "customer_id" text not null, "product_id" text not null, "variant_id" text not null, "currency_code" text not null, "region_id" text null, "alert_type" text not null default 'price_drop', "reference_price" numeric not null, "target_price" numeric null, "channel" text not null default 'in-app', "status" text not null default 'active', "notified_at" timestamptz null, "metadata" jsonb null, "raw_reference_price" jsonb not null, "raw_target_price" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "price_alert_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_deleted_at" ON "price_alert" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_customer_id" ON "price_alert" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_product_id" ON "price_alert" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_variant_id" ON "price_alert" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_currency_code" ON "price_alert" ("currency_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_status" ON "price_alert" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_channel" ON "price_alert" ("channel") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_created_at" ON "price_alert" ("created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_variant_id_currency_code_status" ON "price_alert" ("variant_id", "currency_code", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_alert_customer_id_status" ON "price_alert" ("customer_id", "status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "price_alert" cascade;`);
  }

}
