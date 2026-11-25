import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151633 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_video" ("id" text not null, "product_id" text not null, "variant_id" text null, "provider" text not null default 'external', "video_url" text not null, "video_id" text null, "title" text null, "description" text null, "thumbnail_url" text null, "sort_order" integer not null default 0, "status" text not null default 'active', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_video_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_deleted_at" ON "product_video" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_product_id" ON "product_video" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_variant_id" ON "product_video" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_product_id_sort_order" ON "product_video" ("product_id", "sort_order") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_product_id_status" ON "product_video" ("product_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_status" ON "product_video" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_provider" ON "product_video" ("provider") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_video_created_at" ON "product_video" ("created_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_video" cascade;`);
  }

}
