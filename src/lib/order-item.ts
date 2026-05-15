export interface OrderLineItemData {
  productId?: string | number
  productName: string
  productImage?: string
  productSlug?: string
  quantity: number
  price: number
  size?: string
  fabric?: string
  productColor?: string
}

/** Cart line ids are often composite; product pages use the 24-char Mongo id when present. */
export function resolveOrderItemProductId(
  item: Pick<OrderLineItemData, "productId"> & { id?: string | number },
): string | null {
  const candidates = [item.productId, item.id]
    .filter((value) => value != null)
    .map((value) => String(value).trim())
    .filter(Boolean)

  for (const candidate of candidates) {
    if (/^[a-f0-9]{24}$/i.test(candidate)) return candidate
    const embeddedId = candidate.match(/[a-f0-9]{24}/i)?.[0]
    if (embeddedId) return embeddedId
  }

  return null
}

export function getOrderItemProductHref(item: Pick<OrderLineItemData, "productId" | "productSlug"> & { id?: string | number }): string | null {
  const id = resolveOrderItemProductId(item) ?? ""
  if (id) return `/product/${id}`
  const slug = item.productSlug?.trim()
  if (slug) return `/product/${slug}`
  return null
}

export function formatOrderItemSpecs(item: Pick<OrderLineItemData, "size" | "fabric" | "productColor">): string {
  return [item.size, item.fabric, item.productColor].filter(Boolean).join(" • ")
}

export function normalizeOrderLineItem(raw: unknown): OrderLineItemData & { id?: string } {
  const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}

  const price = Number(item.price)
  const quantity = Number(item.quantity)

  return {
    id: item.id != null ? String(item.id) : item._id != null ? String(item._id) : undefined,
    productId: item.productId != null ? String(item.productId) : undefined,
    productName: String(item.productName ?? item.name ?? "Product"),
    productImage: typeof item.productImage === "string" ? item.productImage : typeof item.image === "string" ? item.image : undefined,
    productSlug: typeof item.productSlug === "string" ? item.productSlug : typeof item.slug === "string" ? item.slug : undefined,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    price: Number.isFinite(price) ? price : 0,
    size: item.size != null ? String(item.size) : undefined,
    fabric: item.fabric != null ? String(item.fabric) : undefined,
    productColor: item.productColor != null ? String(item.productColor) : undefined,
  }
}

export function getOrderItemProductUrl(
  item: Pick<OrderLineItemData, "productId" | "productSlug">,
  baseUrl: string,
): string | null {
  const href = getOrderItemProductHref(item)
  if (!href) return null
  return `${baseUrl.replace(/\/$/, "")}${href}`
}
