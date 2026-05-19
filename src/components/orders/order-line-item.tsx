"use client"

import Link from "next/link"
import { OrderProductThumbnail } from "@/components/orders/order-product-thumbnail"
import {
  formatOrderItemSpecs,
  getOrderItemProductHref,
  type OrderLineItemData,
} from "@/lib/order-item"

interface OrderLineItemProps {
  item: OrderLineItemData & { id?: string | number }
  showPrice?: boolean
  thumbnailSize?: "sm" | "md" | "lg"
  className?: string
}

export function OrderLineItem({
  item,
  showPrice = true,
  thumbnailSize = "lg",
  className = "",
}: OrderLineItemProps) {
  const productHref = getOrderItemProductHref(item)
  const specs = formatOrderItemSpecs(item)
  const unitPrice = Number(item.price)
  const qty = Number(item.quantity)
  const safePrice = Number.isFinite(unitPrice) ? unitPrice : 0
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1

  return (
    <div className={`flex gap-4 ${className}`}>
      <OrderProductThumbnail item={item} size={thumbnailSize} />

      <div className="flex-1 min-w-0">
        {productHref ? (
          <Link
            href={productHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-[#6D4530] hover:text-[#8B5A3C] hover:underline transition-colors break-words"
          >
            {item.productName}
          </Link>
        ) : (
          <p className="text-base font-semibold text-[#6D4530] break-words">{item.productName}</p>
        )}

        <p className="text-xs sm:text-sm text-[#8B5A3C]/70 mt-1">Qty: {safeQty}</p>

        {specs && <p className="text-xs text-[#8B5A3C]/60 mt-1 break-words">{specs}</p>}
      </div>

      {showPrice && (
        <div className="flex-shrink-0 text-right whitespace-nowrap">
          <p className="text-sm text-[#8B5A3C]/70">Unit</p>
          <p className="text-lg font-semibold text-[#6D4530]">₹{safePrice.toFixed(2)}</p>
          <p className="text-base font-semibold text-[#6D4530] mt-2">
            ₹{(safePrice * safeQty).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  )
}
