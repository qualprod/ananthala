"use client"

import { useSimpleProduct } from "@/hooks/use-simple-product"
import { useState } from "react"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"
import Image from "next/image"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { ProductImageViewerModal } from "@/components/product/product-image-viewer-modal"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Loader2, IndianRupee } from "lucide-react"

interface SimpleProductConfiguratorProps {
  product: ProductDetail
  onAddToCart: (item: CartItem) => void
  isAddingToCart: boolean
  colors: {
    bg50: string
    bg100: string
    border: string
    accent: string
    accentHover: string
    text: string
    textDark: string
    textLight: string
  }
}

/**
 * Simple Product Configurator Component
 * Handles standard product display with size/quantity selection
 */
export function SimpleProductConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
  colors,
}: SimpleProductConfiguratorProps) {
  const { selectedSize, setSelectedSize, quantity, setQuantity, selectedImage, setSelectedImage, price } = useSimpleProduct(product)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  
  const handleAddToCart = async () => {
    const cartItem: CartItem = {
      id: `${product.id}-${selectedSize}`,
      name: product.name,
      image: product.images[0],
      size: selectedSize,
      quantity: quantity,
      price: price,
    }
    onAddToCart(cartItem)
  }
  
  return (
    <>
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
        {/* Main Image */}
        <div
          className="mb-4 cursor-pointer"
          style={{ backgroundColor: colors.bg50 }}
          onClick={() => setIsImageViewerOpen(true)}
        >
          <MagnifyImage
            src={product.images[selectedImage]}
            alt={product.name}
            className="w-full"
            imgClassName="h-full"
            enableHoverZoom={false}
            enableMobileTapZoom={false}
            showMobileHint={false}
          />
        </div>
        
        {/* Thumbnail Gallery */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3 max-w-[320px] sm:max-w-[360px]">
            {product.images.map((image: string, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault()
                  setSelectedImage(index)
                }}
                type="button"
                className="relative w-full aspect-square border-2 transition-colors cursor-pointer hover:opacity-80"
                style={{
                  borderColor:
                    selectedImage === index ? colors.accent : colors.border,
                }}
              >
                <Image
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover pointer-events-none"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-2xl font-normal text-black mb-4 tracking-wider uppercase">
            {product.name}
          </p>

        <p className="mb-6 text-lg text-black">
          {product.description}
        </p>

        <div
          className="mb-8 pb-8 border-b"
          style={{ borderColor: colors.border }}
        >
          <div className="mb-4">
            <div className="flex items-center gap-1 text-black">
              <IndianRupee className="w-5 h-5 text-black" />
              <span className="text-2xl font-normal">
                {price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block mb-3 text-black text-lg">
              Select Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size.name)}
                  className="py-3 px-4 border-2 transition-colors"
                  style={{
                    borderColor:
                      selectedSize === size.name
                        ? "#EED9C4"
                        : colors.border,
                    backgroundColor:
                      selectedSize === size.name
                        ? "rgba(238, 217, 196, 0.35)"
                        : "transparent",
                    color: "black",
                  }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block mb-3 text-lg text-black font-cormorant font-normal">
              Quantity
            </label>
            <div className="inline-flex items-center border rounded" style={{ borderColor: colors.border }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:opacity-70 transition-opacity text-black text-lg font-cormorant font-normal"
                style={{
                  borderRight: `1px solid ${colors.border}`,
                }}
              >
                -
              </button>
              <span className="px-6 py-2 text-black text-lg min-w-[60px] text-center font-cormorant font-normal">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:opacity-70 transition-opacity text-black text-lg font-cormorant font-normal"
                style={{
                  borderLeft: `1px solid ${colors.border}`,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full py-4 text-black text-lg font-medium hover:opacity-90 transition-opacity mb-3 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#EED9C4" }}
          >
            {isAddingToCart ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding to Cart...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Add to Cart -{" "}
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  <span>
                    {(price * quantity).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </>
            )}
          </button>
          <p className="text-center text-base text-black">
            Free shipping on all orders
          </p>
        </div>
        </div>
      </div>
    </div>
    <ProductImageViewerModal
      images={product.images}
      initialIndex={selectedImage}
      productName={product.name}
      isOpen={isImageViewerOpen}
      onClose={() => setIsImageViewerOpen(false)}
    />
    </>
  )
}
