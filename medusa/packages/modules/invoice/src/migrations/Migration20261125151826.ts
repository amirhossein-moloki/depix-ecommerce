import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151826 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice_sequence" drop constraint if exists "invoice_sequence_name_unique";`);
    this.addSql(`alter table if exists "invoice" drop constraint if exists "invoice_order_id_unique";`);
    this.addSql(`alter table if exists "invoice" drop constraint if exists "invoice_invoice_number_unique";`);
    this.addSql(`create table if not exists "invoice" ("id" text not null, "display_id" serial, "invoice_number" text not null, "order_id" text not null, "customer_id" text null, "status" text check ("status" in ('issued', 'paid', 'cancelled')) not null default 'issued', "currency_code" text not null, "issue_date" timestamptz not null, "due_date" timestamptz null, "subtotal" integer not null, "discount_total" integer not null default 0, "tax_total" integer not null default 0, "shipping_total" integer not null default 0, "total" integer not null, "seller_details" jsonb null, "billing_address" jsonb null, "shipping_address" jsonb null, "file_id" text null, "file_url" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_deleted_at" ON "invoice" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_invoice_number_unique" ON "invoice" ("invoice_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_order_id_unique" ON "invoice" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_customer_id" ON "invoice" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_status" ON "invoice" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "invoice_item" ("id" text not null, "invoice_id" text not null, "item_id" text null, "title" text not null, "subtitle" text null, "product_id" text null, "variant_id" text null, "quantity" integer not null, "unit_price" integer not null, "subtotal" integer not null, "tax_total" integer not null default 0, "discount_total" integer not null default 0, "total" integer not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_item_invoice_id" ON "invoice_item" ("invoice_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_item_deleted_at" ON "invoice_item" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_item_item_id" ON "invoice_item" ("item_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_item_product_id" ON "invoice_item" ("product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "invoice_sequence" ("id" text not null, "name" text not null default 'default', "current_value" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_sequence_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_sequence_deleted_at" ON "invoice_sequence" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_sequence_name_unique" ON "invoice_sequence" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "invoice_item" add constraint "invoice_item_invoice_id_foreign" foreign key ("invoice_id") references "invoice" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "invoice_item" drop constraint if exists "invoice_item_invoice_id_foreign";`);

    this.addSql(`drop table if exists "invoice" cascade;`);

    this.addSql(`drop table if exists "invoice_item" cascade;`);

    this.addSql(`drop table if exists "invoice_sequence" cascade;`);
  }

}
