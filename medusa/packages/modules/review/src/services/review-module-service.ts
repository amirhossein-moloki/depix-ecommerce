import { MedusaService } from "@medusajs/framework/utils"
import { ProductReview, ReviewReply } from "../models"

export default class ReviewModuleService extends MedusaService({
  ProductReview,
  ReviewReply,
}) {}
