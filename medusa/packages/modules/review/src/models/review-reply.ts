import { model } from "@medusajs/framework/utils"
import ProductReview from "./product-review"

const ReviewReply = model
  .define("ReviewReply", {
    id: model.id({ prefix: "rrep" }).primaryKey(),
    review_id: model.text().index(),
    admin_id: model.text(),
    content: model.text(),
    metadata: model.json().nullable(),
    review: model.hasOne(() => ProductReview, {
      mappedBy: "reply",
    }),
  })

export default ReviewReply
