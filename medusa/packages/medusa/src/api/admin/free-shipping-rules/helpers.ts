export function mergeFreeShippingRuleMetadata(
  input: {
    description?: string | null
    max_purchase_amount?: number | null
    usage_limit?: number | null
    used_count?: number
    metadata?: Record<string, unknown> | null
  },
  existingMetadata?: Record<string, unknown> | null
): Record<string, unknown> | null {
  const merged: Record<string, unknown> = {
    ...(existingMetadata ?? {}),
    ...(input.metadata ?? {}),
  }

  if (input.description !== undefined) merged.description = input.description
  if (input.max_purchase_amount !== undefined) {
    merged.max_purchase_amount = input.max_purchase_amount
  }
  if (input.usage_limit !== undefined) merged.usage_limit = input.usage_limit
  if (input.used_count !== undefined) merged.used_count = input.used_count

  return Object.keys(merged).length > 0 ? merged : (input.metadata ?? null)
}

export function enrichFreeShippingRuleResponse<T extends Record<string, any>>(
  rule: T
): T {
  if (!rule || typeof rule !== "object") {
    return rule
  }
  const meta = (rule.metadata ?? {}) as Record<string, any>
  const extras: Record<string, any> = {}

  if (rule.description !== undefined || meta.description !== undefined) {
    extras.description = rule.description ?? meta.description
  }
  if (
    rule.max_purchase_amount !== undefined ||
    meta.max_purchase_amount !== undefined
  ) {
    extras.max_purchase_amount =
      rule.max_purchase_amount ?? meta.max_purchase_amount
  }
  if (rule.usage_limit !== undefined || meta.usage_limit !== undefined) {
    extras.usage_limit = rule.usage_limit ?? meta.usage_limit
  }
  if (rule.used_count !== undefined || meta.used_count !== undefined) {
    extras.used_count = Number(rule.used_count ?? meta.used_count ?? 0)
  }

  return Object.keys(extras).length > 0 ? { ...rule, ...extras } : rule
}
