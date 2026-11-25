import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Migration Script: Ensure Iran Region (IRR) and Store Defaults Exist
 *
 * Idempotently configures:
 * - Default Sales Channel (if none exists)
 * - Store supported currency `irr` (default)
 * - Region `Iran` (`currency_code: "irr"`, `countries: ["ir"]`, `automatic_taxes: true`)
 * - Store `default_region_id` and `default_sales_channel_id`
 */
export default async function ensureIranStoreDefaults({
  container,
}: ExecArgs): Promise<void> {
  if (
    !MedusaModule.isInstalled(Modules.STORE) ||
    !MedusaModule.isInstalled(Modules.REGION)
  ) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storeService = container.resolve<any>(Modules.STORE)
  const regionService = container.resolve<any>(Modules.REGION)

  const stores = await storeService.listStores(
    {},
    { relations: ["supported_currencies"] }
  )
  const store = stores?.[0]
  if (!store) {
    logger.info("No store record found; skipping Iran store defaults.")
    return
  }

  // 1. Ensure default sales channel
  let defaultSalesChannelId = store.default_sales_channel_id as string | null
  if (
    !defaultSalesChannelId &&
    MedusaModule.isInstalled(Modules.SALES_CHANNEL)
  ) {
    const salesChannelService = container.resolve<any>(Modules.SALES_CHANNEL)
    const channels = await salesChannelService.listSalesChannels({})
    if (channels?.length > 0) {
      defaultSalesChannelId = channels[0].id
    } else {
      const { result } = await createSalesChannelsWorkflow(container).run({
        input: {
          salesChannelsData: [
            {
              name: "Default Sales Channel",
              description: "Created for Depix storefront",
              is_disabled: false,
            },
          ],
        },
      })
      defaultSalesChannelId = result?.[0]?.id ?? null
    }
  }

  // 2. Ensure `irr` is in store supported_currencies
  const hasIrrCurrency = (store.supported_currencies ?? []).some(
    (c: any) => String(c?.currency_code || "").toLowerCase() === "irr"
  )

  if (!hasIrrCurrency) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: [{ currency_code: "irr", is_default: true }],
        },
      },
    })
    logger.info("Configured store default currency to IRR.")
  }

  // 3. Ensure Iran region exists
  let defaultRegionId = store.default_region_id as string | null
  const existingRegions = await regionService.listRegions({})
  const iranRegion = (existingRegions ?? []).find(
    (r: any) =>
      String(r?.currency_code || "").toLowerCase() === "irr" ||
      String(r?.name || "").toLowerCase() === "iran"
  )

  if (iranRegion) {
    defaultRegionId ??= iranRegion.id
  } else if (!existingRegions?.length) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Iran",
            currency_code: "irr",
            countries: ["ir"],
            automatic_taxes: true,
          },
        ],
      },
    })
    defaultRegionId = result?.[0]?.id ?? null
    logger.info(`Created default Iran (IRR) region: ${defaultRegionId}`)
  }

  // 4. Link default_region_id and default_sales_channel_id on store if missing
  const storeUpdate: Record<string, any> = {}
  if (!store.default_region_id && defaultRegionId) {
    storeUpdate.default_region_id = defaultRegionId
  }
  if (!store.default_sales_channel_id && defaultSalesChannelId) {
    storeUpdate.default_sales_channel_id = defaultSalesChannelId
  }

  if (Object.keys(storeUpdate).length > 0) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: storeUpdate,
      },
    })
    logger.info("Updated store default_region_id / default_sales_channel_id.")
  }
}
