import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151632 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_relationship" ("id" text not null, "source_product_id" text not null, "related_product_id" text not null, "relationship_type" text not null default 'RELATED', "priority" integer not null default 0, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_relationship_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_relationship_deleted_at" ON "product_relationship" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_relationship_source_product_id" ON "product_relationship" ("source_product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_relationship_related_product_id" ON "product_relationship" ("related_product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_relationship_relationship_type" ON "product_relationship" ("relationship_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_relationship_is_active" ON "product_relationship" ("is_active") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "recommendation_model" ("id" text not null, "version" text not null, "algorithm" text not null default 'implicit-collaborative-filtering', "status" text not null default 'TRAINING', "is_active" boolean not null default false, "training_timestamp" text null, "data_range_start" text null, "data_range_end" text null, "metrics" jsonb null, "parameters" jsonb null, "artifact_data" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_model_deleted_at" ON "recommendation_model" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_relationship" cascade;`);

    this.addSql(`drop table if exists "recommendation_model" cascade;`);
  }

}
