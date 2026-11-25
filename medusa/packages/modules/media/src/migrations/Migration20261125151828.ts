import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151828 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "media" drop constraint if exists "media_file_key_unique";`);
    this.addSql(`create table if not exists "media" ("id" text not null, "original_filename" text not null, "file_key" text not null, "mime_type" text not null, "file_size" integer not null, "storage_provider" text not null default 'local', "url" text not null, "width" integer null, "height" integer null, "uploaded_by_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_media_deleted_at" ON "media" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_media_file_key_unique" ON "media" ("file_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_media_mime_type" ON "media" ("mime_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_media_uploaded_by" ON "media" ("uploaded_by_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "media" cascade;`);
  }

}
