"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package } from "lucide-react"
import { getOrderItemProductHref, resolveOrderItemProductId, type OrderLineItemData } from "@/lib/order-item"

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16 sm:w-20 sm:h-20",
  lg: "w-24 h-24",
} as const

interface OrderProductThumbnailProps {
  item: Pick<OrderLineItemData, "productId" | "productName" | "productImage" | "productSlug"> & {
    id?: string | number
  }
  size?: keyof typeof sizeClasses
  linkable?: boolean
  className?: string
}

export function OrderProductThumbnail({
  item,
  size = "md",
  linkable = true,
  className = "",
}: OrderProductThumbnailProps) {
  const resolvedProductId = resolveOrderItemProductId(item)
  const storedImage =
    item.productImage && item.productImage !== "/placeholder.svg" ? item.productImage : null

  const [imageSrc, setImageSrc] = useState<string | null>(storedImage)
  const [loading, setLoading] = useState(!storedImage && !!resolvedProductId)
  const [hasError, setHasError] = useState(false)

  const productHref = linkable ? getOrderItemProductHref(item) : null
  const sizeClass = sizeClasses[size]

  useEffect(() => {
    if (storedImage) {
      setImageSrc(storedImage)
      setLoading(false)
      setHasError(false)
      return
    }

    if (!resolvedProductId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchProductImage = async () => {
      try {
        const response = await fetch(`/api/products/${resolvedProductId}`)
        if (!response.ok) {
          if (!cancelled) setHasError(true)
          return
        }
        const data = await response.json()
        const imageUrl = data.product?.primaryImage || data.product?.imageUrls?.[0] || null
        if (!cancelled) {
          if (imageUrl) {
            setImageSrc(imageUrl)
            setHasError(false)
          } else {
            setHasError(true)
          }
        }
      } catch {
        if (!cancelled) setHasError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProductImage()
    return () => {
      cancelled = true
    }
  }, [resolvedProductId, storedImage, item.productImage, item.productId, item.id])

  const content = loading ? (
    <ThumbnailSpinner size={size} />
  ) : imageSrc && !hasError ? (
    <img
      src={imageSrc}
      alt={item.productName}
      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
      onError={() => setHasError(true)}
    />
  ) : (
    <ThumbnailPlaceholder size={size} />
  )

  const boxClass = `flex-shrink-0 ${sizeClass} bg-[#F9F7F4] rounded-lg border flex items-center justify-center overflow-hidden group ${className}`

  if (productHref) {
    return (
      <Link
        href={productHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${boxClass} hover:opacity-80 transition-opacity cursor-pointer`}
        style={{ borderColor: "#D9CFC7" }}
        title={`View ${item.productName}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={boxClass} style={{ borderColor: "#D9CFC7" }}>
      {content}
    </div>
  )
}

function ThumbnailSpinner({ size }: { size: keyof typeof sizeClasses }) {
  return (
    <div
      className={`${size === "sm" ? "w-4 h-4" : "w-6 h-6"} border-2 border-[#D9CFC7] border-t-[#6D4530] rounded-full animate-spin`}
    />
  )
}

function ThumbnailPlaceholder({ size }: { size: keyof typeof sizeClasses }) {
  const iconSize = size === "sm" ? "w-4 h-4" : "w-8 h-8"
  return (
    <div className="text-center p-1">
      <Package className={`${iconSize} text-[#D9CFC7] mx-auto`} />
      {size !== "sm" && <p className="text-xs text-[#8B5A3C]/50 mt-1">No Image</p>}
    </div>
  )
}
