import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151627 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review_reply" drop constraint if exists "review_reply_review_id_unique";`);
    this.addSql(`alter table if exists "product_review" drop constraint if exists "product_review_product_id_customer_id_unique";`);
    this.addSql(`create table if not exists "product_review" ("id" text not null, "product_id" text not null, "customer_id" text not null, "rating" integer not null, "title" text null, "content" text not null, "status" text check ("status" in ('PENDING', 'APPROVED', 'REJECTED')) not null default 'PENDING', "verified_purchase" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_product_id" ON "product_review" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_customer_id" ON "product_review" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_deleted_at" ON "product_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_review_product_id_customer_id_unique" ON "product_review" ("product_id", "customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_product_id_status" ON "product_review" ("product_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_status" ON "product_review" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_reply" ("id" text not null, "admin_id" text not null, "content" text not null, "metadata" jsonb null, "review_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_reply_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_reply_review_id_unique" ON "review_reply" ("review_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_reply_deleted_at" ON "review_reply" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_reply_review_id" ON "review_reply" ("review_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "review_reply" add constraint "review_reply_review_id_foreign" foreign key ("review_id") references "product_review" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review_reply" drop constraint if exists "review_reply_review_id_foreign";`);

    this.addSql(`drop table if exists "product_review" cascade;`);

    this.addSql(`drop table if exists "review_reply" cascade;`);
  }

}
