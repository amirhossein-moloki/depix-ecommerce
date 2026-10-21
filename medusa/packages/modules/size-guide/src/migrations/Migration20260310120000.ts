import { Migration } from "@mikro-orm/migrations"

export class Migration20260310120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "size_guide_template" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "description" text NULL,
        "columns" jsonb NOT NULL DEFAULT '[]',
        "rows" jsonb NOT NULL DEFAULT '[]',
        "notes" text NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "PK_size_guide_template_id" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_size_guide_template_is_active" ON "size_guide_template" ("is_active") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_size_guide_template_name" ON "size_guide_template" ("name") WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_size_guide" (
        "id" text NOT NULL,
        "product_id" text NOT NULL,
        "title" text NOT NULL,
        "description" text NULL,
        "columns" jsonb NOT NULL DEFAULT '[]',
        "rows" jsonb NOT NULL DEFAULT '[]',
        "notes" text NULL,
        "source_template_id" text NULL,
        "image_id" text NULL,
        "image_url" text NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "PK_product_size_guide_id" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_size_guide_product_id_unique" ON "product_size_guide" ("product_id") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_product_size_guide_source_template_id" ON "product_size_guide" ("source_template_id") WHERE deleted_at IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "product_size_guide" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "size_guide_template" CASCADE;`)
  }
}
