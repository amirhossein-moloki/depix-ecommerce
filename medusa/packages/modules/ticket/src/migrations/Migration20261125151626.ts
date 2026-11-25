import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125151626 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ticket" drop constraint if exists "ticket_ticket_number_unique";`);
    this.addSql(`alter table if exists "ticket_category" drop constraint if exists "ticket_category_slug_unique";`);
    this.addSql(`create table if not exists "ticket_category" ("id" text not null, "name" text not null, "slug" text not null, "description" text null, "is_active" boolean not null default true, "sort_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ticket_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ticket_category_slug_unique" ON "ticket_category" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_category_deleted_at" ON "ticket_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_category_is_active_sort_order" ON "ticket_category" ("is_active", "sort_order") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ticket" ("id" text not null, "ticket_number" text not null, "user_id" text not null, "category_id" text null, "order_id" text null, "product_id" text null, "subject" text not null, "status" text check ("status" in ('open', 'in_progress', 'waiting_for_customer', 'answered', 'resolved', 'closed')) not null default 'open', "priority" text check ("priority" in ('low', 'normal', 'high')) not null default 'normal', "assigned_to" text null, "first_response_at" timestamptz null, "last_message_at" timestamptz not null default Wed Nov 25 2026 15:16:21 GMT+0000 (Coordinated Universal Time), "closed_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ticket_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ticket_ticket_number_unique" ON "ticket" ("ticket_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_user_id" ON "ticket" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_category_id" ON "ticket" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_order_id" ON "ticket" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_product_id" ON "ticket" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_assigned_to" ON "ticket" ("assigned_to") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_deleted_at" ON "ticket" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_user_id_status" ON "ticket" ("user_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_assigned_to_status" ON "ticket" ("assigned_to", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_category_id_status" ON "ticket" ("category_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_status_priority" ON "ticket" ("status", "priority") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ticket_history" ("id" text not null, "ticket_id" text not null, "actor_id" text not null, "action" text not null, "old_value" text null, "new_value" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ticket_history_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_history_ticket_id" ON "ticket_history" ("ticket_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_history_deleted_at" ON "ticket_history" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ticket_message" ("id" text not null, "ticket_id" text not null, "sender_id" text not null, "sender_type" text check ("sender_type" in ('customer', 'user')) not null default 'customer', "message" text not null, "is_internal_note" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ticket_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_message_ticket_id" ON "ticket_message" ("ticket_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_message_sender_id" ON "ticket_message" ("sender_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_message_deleted_at" ON "ticket_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ticket_attachment" ("id" text not null, "message_id" text not null, "original_filename" text not null, "storage_path" text not null, "mime_type" text not null, "file_size" integer not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ticket_attachment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_attachment_message_id" ON "ticket_attachment" ("message_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_attachment_deleted_at" ON "ticket_attachment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "ticket" add constraint "ticket_category_id_foreign" foreign key ("category_id") references "ticket_category" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "ticket_history" add constraint "ticket_history_ticket_id_foreign" foreign key ("ticket_id") references "ticket" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ticket_message" add constraint "ticket_message_ticket_id_foreign" foreign key ("ticket_id") references "ticket" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ticket_attachment" add constraint "ticket_attachment_message_id_foreign" foreign key ("message_id") references "ticket_message" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ticket" drop constraint if exists "ticket_category_id_foreign";`);

    this.addSql(`alter table if exists "ticket_history" drop constraint if exists "ticket_history_ticket_id_foreign";`);

    this.addSql(`alter table if exists "ticket_message" drop constraint if exists "ticket_message_ticket_id_foreign";`);

    this.addSql(`alter table if exists "ticket_attachment" drop constraint if exists "ticket_attachment_message_id_foreign";`);

    this.addSql(`drop table if exists "ticket_category" cascade;`);

    this.addSql(`drop table if exists "ticket" cascade;`);

    this.addSql(`drop table if exists "ticket_history" cascade;`);

    this.addSql(`drop table if exists "ticket_message" cascade;`);

    this.addSql(`drop table if exists "ticket_attachment" cascade;`);
  }

}
