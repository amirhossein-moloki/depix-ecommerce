import { model } from "@medusajs/framework/utils"
import ProductReview from "./product-review"

const ReviewReply = model
  .define("ReviewReply", {
    id: model.id({ prefix: "rrep" }).primaryKey(),
    admin_id: model.text(),
    content: model.text(),
    metadata: model.json().nullable(),
    review: model.belongsTo(() => ProductReview, {
      mappedBy: "reply",
    }),
  })
  .indexes([
    {
      on: ["review_id"],
    },
  ])

export default ReviewReply
