import { model } from "@medusajs/framework/utils"
import InventoryItem from "./inventory-item"
import InventoryLevel from "./inventory-level"

const InventoryTransaction = model
  .define("InventoryTransaction", {
    id: model.id({ prefix: "itrx" }).primaryKey(),
    inventory_item_id: model.text(),
    inventory_level_id: model.text().nullable(),
    product_id: model.text().nullable(),
    variant_id: model.text().nullable(),
    location_id: model.text().nullable(),
    quantity_before: model.number().default(0),
    quantity_change: model.number(),
    quantity_after: model.number().default(0),
    type: model.text(), // 'increase' | 'decrease'
    reason: model.text(), // 'initial_stock' | 'purchase' | 'sale' | 'cancellation' | 'return' | 'damaged' | 'manual_adjustment' | 'inventory_count'
    note: model.text().nullable(),
    reference_type: model.text().nullable(), // 'order' | 'fulfillment' | 'return' | 'manual' | 'system'
    reference_id: model.text().nullable(),
    created_by: model.text().nullable(),
    metadata: model.json().nullable(),
    inventory_item: model.belongsTo(() => InventoryItem, {
      mappedBy: "transactions",
    }),
    inventory_level: model.belongsTo(() => InventoryLevel, {
      mappedBy: "transactions",
    }),
  })
  .indexes([
    {
      name: "IDX_inventory_transaction_inventory_item_id",
      on: ["inventory_item_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_inventory_level_id",
      on: ["inventory_level_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_location_id",
      on: ["location_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_product_id",
      on: ["product_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_variant_id",
      on: ["variant_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_type",
      on: ["type"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_reason",
      on: ["reason"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_reference",
      on: ["reference_type", "reference_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_inventory_transaction_created_by",
      on: ["created_by"],
      where: "deleted_at IS NULL",
    },
  ])

export default InventoryTransaction
