import { MedusaService } from "@medusajs/framework/utils"
import Media from "../models/media"

export default class MediaModuleService extends MedusaService({
  Media,
}) {}
