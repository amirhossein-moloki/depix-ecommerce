import { model } from "@medusajs/framework/utils"
import ReviewReply from "./review-reply"

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

const ProductReview = model
  .define("ProductReview", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    product_id: model.text().index(),
    customer_id: model.text().index(),
    rating: model.number(),
    title: model.text().nullable(),
    content: model.text(),
    status: model.enum(ReviewStatus).default(ReviewStatus.PENDING),
    verified_purchase: model.boolean().default(false),
    metadata: model.json().nullable(),
    reply: model.hasOne(() => ReviewReply, {
      mappedBy: "review",
    }),
  })
  .indexes([
    {
      on: ["product_id", "customer_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["product_id", "status"],
    },
    {
      on: ["status"],
    },
  ])

export default ProductReview
