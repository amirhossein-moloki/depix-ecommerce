import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260310000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "inventory_transaction" (' +
        '"id" text not null, ' +
        '"created_at" timestamptz not null default now(), ' +
        '"updated_at" timestamptz not null default now(), ' +
        '"deleted_at" timestamptz null, ' +
        '"inventory_item_id" text not null, ' +
        '"inventory_level_id" text null, ' +
        '"product_id" text null, ' +
        '"variant_id" text null, ' +
        '"location_id" text null, ' +
        '"quantity_before" integer not null default 0, ' +
        '"quantity_change" integer not null, ' +
        '"quantity_after" integer not null default 0, ' +
        '"type" text not null, ' +
        '"reason" text not null, ' +
        '"note" text null, ' +
        '"reference_type" text null, ' +
        '"reference_id" text null, ' +
        '"created_by" text null, ' +
        '"metadata" jsonb null, ' +
        'constraint "inventory_transaction_pkey" primary key ("id")' +
      ');'
    )

    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_deleted_at" ON "inventory_transaction" (deleted_at) WHERE deleted_at IS NOT NULL;'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_inventory_item_id" ON "inventory_transaction" (inventory_item_id);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_inventory_level_id" ON "inventory_transaction" (inventory_level_id);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_location_id" ON "inventory_transaction" (location_id);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_product_id" ON "inventory_transaction" (product_id);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_variant_id" ON "inventory_transaction" (variant_id);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_type" ON "inventory_transaction" (type);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_reason" ON "inventory_transaction" (reason);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_reference" ON "inventory_transaction" (reference_type, reference_id);'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_transaction_created_by" ON "inventory_transaction" (created_by);'
    )

    this.addSql(
      'alter table if exists "inventory_transaction" add constraint "inventory_transaction_inventory_item_id_foreign" foreign key ("inventory_item_id") references "inventory_item" ("id") on update cascade on delete cascade;'
    )
    this.addSql(
      'alter table if exists "inventory_transaction" add constraint "inventory_transaction_inventory_level_id_foreign" foreign key ("inventory_level_id") references "inventory_level" ("id") on update cascade on delete set null;'
    )
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "inventory_transaction" drop constraint if exists "inventory_transaction_inventory_item_id_foreign";'
    )
    this.addSql(
      'alter table if exists "inventory_transaction" drop constraint if exists "inventory_transaction_inventory_level_id_foreign";'
    )
    this.addSql('drop table if exists "inventory_transaction" cascade;')
  }
}
