import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261127110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "banner" ("id" text not null, "title" text null, "placement" text check ("placement" in ('hero_main', 'hero_secondary')) not null default 'hero_main', "image_url" text not null, "link_url" text null, "sort_order" integer not null default 0, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "banner_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_banner_deleted_at" ON "banner" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_banner_placement_active_sort" ON "banner" ("placement", "is_active", "sort_order") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "banner" cascade;`)
  }
}
