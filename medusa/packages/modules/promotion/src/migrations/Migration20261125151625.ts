import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151625 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "promotion_application_method" drop constraint if exists "promotion_application_method_promotion_id_unique";`);
    this.addSql(`alter table if exists "promotion_campaign_budget_usage" drop constraint if exists "promotion_campaign_budget_usage_attribute_value_budget_id_unique";`);
    this.addSql(`alter table if exists "promotion_campaign_budget" drop constraint if exists "promotion_campaign_budget_campaign_id_unique";`);
    this.addSql(`alter table if exists "promotion_campaign" drop constraint if exists "promotion_campaign_campaign_identifier_unique";`);
    this.addSql(`create table if not exists "promotion_campaign" ("id" text not null, "name" text not null, "description" text null, "campaign_identifier" text not null, "starts_at" timestamptz null, "ends_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_campaign_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_campaign_deleted_at" ON "promotion_campaign" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promotion_campaign_campaign_identifier_unique" ON "promotion_campaign" ("campaign_identifier") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "promotion_campaign_budget" ("id" text not null, "type" text check ("type" in ('spend', 'usage', 'use_by_attribute', 'spend_by_attribute')) not null, "currency_code" text null, "limit" numeric null, "used" numeric not null default 0, "campaign_id" text not null, "attribute" text null, "raw_limit" jsonb null, "raw_used" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_campaign_budget_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_campaign_budget_type" ON "promotion_campaign_budget" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promotion_campaign_budget_campaign_id_unique" ON "promotion_campaign_budget" ("campaign_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_campaign_budget_deleted_at" ON "promotion_campaign_budget" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "promotion_campaign_budget_usage" ("id" text not null, "attribute_value" text not null, "used" numeric not null default 0, "budget_id" text not null, "raw_used" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_campaign_budget_usage_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_campaign_budget_usage_budget_id" ON "promotion_campaign_budget_usage" ("budget_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_campaign_budget_usage_deleted_at" ON "promotion_campaign_budget_usage" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promotion_campaign_budget_usage_attribute_value_budget_id_unique" ON "promotion_campaign_budget_usage" ("attribute_value", "budget_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "promotion_free_shipping_rule" ("id" text not null, "title" text not null, "scope" text check ("scope" in ('store', 'products', 'categories', 'campaign')) not null default 'store', "product_ids" jsonb null, "category_ids" jsonb null, "campaign_id" text null, "min_purchase_amount" numeric null, "starts_at" timestamptz null, "ends_at" timestamptz null, "is_active" boolean not null default true, "metadata" jsonb null, "raw_min_purchase_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_free_shipping_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_free_shipping_rule_deleted_at" ON "promotion_free_shipping_rule" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_free_shipping_rule_is_active" ON "promotion_free_shipping_rule" ("is_active") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_free_shipping_rule_scope" ON "promotion_free_shipping_rule" ("scope") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "promotion" ("id" text not null, "code" text not null, "is_automatic" boolean not null default false, "is_tax_inclusive" boolean not null default false, "limit" integer null, "used" integer not null default 0, "type" text check ("type" in ('standard', 'buyget')) not null, "status" text check ("status" in ('draft', 'active', 'inactive')) not null default 'draft', "campaign_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_type" ON "promotion" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_status" ON "promotion" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_campaign_id" ON "promotion" ("campaign_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_deleted_at" ON "promotion" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_unique_promotion_code" ON "promotion" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_is_automatic" ON "promotion" ("is_automatic") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "promotion_application_method" ("id" text not null, "value" numeric null, "currency_code" text null, "max_quantity" integer null, "apply_to_quantity" integer null, "buy_rules_min_quantity" integer null, "type" text check ("type" in ('fixed', 'percentage')) not null, "target_type" text check ("target_type" in ('order', 'shipping_methods', 'items')) not null, "allocation" text check ("allocation" in ('each', 'across', 'once')) null, "promotion_id" text not null, "raw_value" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_application_method_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_application_method_type" ON "promotion_application_method" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_application_method_target_type" ON "promotion_application_method" ("target_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_application_method_allocation" ON "promotion_application_method" ("allocation") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promotion_application_method_promotion_id_unique" ON "promotion_application_method" ("promotion_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_application_method_deleted_at" ON "promotion_application_method" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_application_method_currency_code" ON "promotion_application_method" ("currency_code") WHERE deleted_at IS NOT NULL;`);

    this.addSql(`create table if not exists "promotion_rule" ("id" text not null, "description" text null, "attribute" text not null, "operator" text check ("operator" in ('gte', 'lte', 'gt', 'lt', 'eq', 'ne', 'in')) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_attribute" ON "promotion_rule" ("attribute") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_operator" ON "promotion_rule" ("operator") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_deleted_at" ON "promotion_rule" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_attribute_operator" ON "promotion_rule" ("attribute", "operator") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_attribute_operator_id" ON "promotion_rule" ("operator", "attribute", "id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "promotion_promotion_rule" ("promotion_id" text not null, "promotion_rule_id" text not null, constraint "promotion_promotion_rule_pkey" primary key ("promotion_id", "promotion_rule_id"));`);

    this.addSql(`create table if not exists "application_method_target_rules" ("application_method_id" text not null, "promotion_rule_id" text not null, constraint "application_method_target_rules_pkey" primary key ("application_method_id", "promotion_rule_id"));`);

    this.addSql(`create table if not exists "application_method_buy_rules" ("application_method_id" text not null, "promotion_rule_id" text not null, constraint "application_method_buy_rules_pkey" primary key ("application_method_id", "promotion_rule_id"));`);

    this.addSql(`create table if not exists "promotion_rule_value" ("id" text not null, "value" text not null, "promotion_rule_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_rule_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_value_promotion_rule_id" ON "promotion_rule_value" ("promotion_rule_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_value_deleted_at" ON "promotion_rule_value" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_value_rule_id_value" ON "promotion_rule_value" ("promotion_rule_id", "value") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promotion_rule_value_value" ON "promotion_rule_value" ("value") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "promotion_campaign_budget" add constraint "promotion_campaign_budget_campaign_id_foreign" foreign key ("campaign_id") references "promotion_campaign" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "promotion_campaign_budget_usage" add constraint "promotion_campaign_budget_usage_budget_id_foreign" foreign key ("budget_id") references "promotion_campaign_budget" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "promotion" add constraint "promotion_campaign_id_foreign" foreign key ("campaign_id") references "promotion_campaign" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "promotion_application_method" add constraint "promotion_application_method_promotion_id_foreign" foreign key ("promotion_id") references "promotion" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "promotion_promotion_rule" add constraint "promotion_promotion_rule_promotion_id_foreign" foreign key ("promotion_id") references "promotion" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "promotion_promotion_rule" add constraint "promotion_promotion_rule_promotion_rule_id_foreign" foreign key ("promotion_rule_id") references "promotion_rule" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "application_method_target_rules" add constraint "application_method_target_rules_application_method_id_foreign" foreign key ("application_method_id") references "promotion_application_method" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "application_method_target_rules" add constraint "application_method_target_rules_promotion_rule_id_foreign" foreign key ("promotion_rule_id") references "promotion_rule" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "application_method_buy_rules" add constraint "application_method_buy_rules_application_method_id_foreign" foreign key ("application_method_id") references "promotion_application_method" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "application_method_buy_rules" add constraint "application_method_buy_rules_promotion_rule_id_foreign" foreign key ("promotion_rule_id") references "promotion_rule" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "promotion_rule_value" add constraint "promotion_rule_value_promotion_rule_id_foreign" foreign key ("promotion_rule_id") references "promotion_rule" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "promotion_campaign_budget" drop constraint if exists "promotion_campaign_budget_campaign_id_foreign";`);

    this.addSql(`alter table if exists "promotion" drop constraint if exists "promotion_campaign_id_foreign";`);

    this.addSql(`alter table if exists "promotion_campaign_budget_usage" drop constraint if exists "promotion_campaign_budget_usage_budget_id_foreign";`);

    this.addSql(`alter table if exists "promotion_application_method" drop constraint if exists "promotion_application_method_promotion_id_foreign";`);

    this.addSql(`alter table if exists "promotion_promotion_rule" drop constraint if exists "promotion_promotion_rule_promotion_id_foreign";`);

    this.addSql(`alter table if exists "application_method_target_rules" drop constraint if exists "application_method_target_rules_application_method_id_foreign";`);

    this.addSql(`alter table if exists "application_method_buy_rules" drop constraint if exists "application_method_buy_rules_application_method_id_foreign";`);

    this.addSql(`alter table if exists "promotion_promotion_rule" drop constraint if exists "promotion_promotion_rule_promotion_rule_id_foreign";`);

    this.addSql(`alter table if exists "application_method_target_rules" drop constraint if exists "application_method_target_rules_promotion_rule_id_foreign";`);

    this.addSql(`alter table if exists "application_method_buy_rules" drop constraint if exists "application_method_buy_rules_promotion_rule_id_foreign";`);

    this.addSql(`alter table if exists "promotion_rule_value" drop constraint if exists "promotion_rule_value_promotion_rule_id_foreign";`);

    this.addSql(`drop table if exists "promotion_campaign" cascade;`);

    this.addSql(`drop table if exists "promotion_campaign_budget" cascade;`);

    this.addSql(`drop table if exists "promotion_campaign_budget_usage" cascade;`);

    this.addSql(`drop table if exists "promotion_free_shipping_rule" cascade;`);

    this.addSql(`drop table if exists "promotion" cascade;`);

    this.addSql(`drop table if exists "promotion_application_method" cascade;`);

    this.addSql(`drop table if exists "promotion_rule" cascade;`);

    this.addSql(`drop table if exists "promotion_promotion_rule" cascade;`);

    this.addSql(`drop table if exists "application_method_target_rules" cascade;`);

    this.addSql(`drop table if exists "application_method_buy_rules" cascade;`);

    this.addSql(`drop table if exists "promotion_rule_value" cascade;`);
  }

}
