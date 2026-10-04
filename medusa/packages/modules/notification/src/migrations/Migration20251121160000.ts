import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20251121160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "notification" add column if not exists "read_at" timestamptz null;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_receiver_id_read_at" ON "notification" ("receiver_id", "read_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_notification_receiver_id_read_at";`
    )
    this.addSql(
      `alter table if exists "notification" drop column if exists "read_at";`
    )
  }
}
