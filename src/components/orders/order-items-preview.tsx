"use client"

import { OrderProductThumbnail } from "@/components/orders/order-product-thumbnail"
import type { OrderLineItemData } from "@/lib/order-item"

interface OrderItemsPreviewProps {
  items: OrderLineItemData[]
  maxThumbnails?: number
}

export function OrderItemsPreview({ items, maxThumbnails = 3 }: OrderItemsPreviewProps) {
  if (!items?.length) {
    return <span className="text-foreground/70">0 items</span>
  }

  const previewItems = items.slice(0, maxThumbnails)
  const remaining = items.length - previewItems.length

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {previewItems.map((item, index) => (
          <OrderProductThumbnail key={`${item.productId ?? item.productName}-${index}`} item={item} size="sm" />
        ))}
        {remaining > 0 && (
          <span className="text-xs text-foreground/60 ml-0.5">+{remaining}</span>
        )}
      </div>
      <span className="text-xs text-foreground/70">
        {items.length} item{items.length === 1 ? "" : "s"}
      </span>
    </div>
  )
}
