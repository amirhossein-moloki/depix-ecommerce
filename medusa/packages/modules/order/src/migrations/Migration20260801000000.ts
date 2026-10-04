import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260801000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_reporting" ON "order" ("created_at", "status", "is_draft_order") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_order_reporting";`
    )
  }
}
