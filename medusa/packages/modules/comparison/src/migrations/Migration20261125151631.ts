import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151631 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "comparison" ("id" text not null, "customer_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "comparison_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_comparison_deleted_at" ON "comparison" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_comparison_customer_id" ON "comparison" ("customer_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "comparison_item" ("id" text not null, "product_id" text not null, "comparison_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "comparison_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_comparison_item_comparison_id" ON "comparison_item" ("comparison_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_comparison_item_deleted_at" ON "comparison_item" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_comparison_item_product_id" ON "comparison_item" ("product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "comparison_item" add constraint "comparison_item_comparison_id_foreign" foreign key ("comparison_id") references "comparison" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "comparison_item" drop constraint if exists "comparison_item_comparison_id_foreign";`);

    this.addSql(`drop table if exists "comparison" cascade;`);

    this.addSql(`drop table if exists "comparison_item" cascade;`);
  }

}
