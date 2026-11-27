import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261127201500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "promotion_campaign" add column if not exists "metadata" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "promotion_campaign" drop column if exists "metadata";`
    )
  }
}
