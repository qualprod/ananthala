"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, IndianRupee, ShoppingCart, Expand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSimpleProduct } from "@/hooks/use-simple-product"
import { useColorConfigurator } from "@/hooks/use-color-cofigurator"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { ColorAwareMagnifyImage } from "@/components/product/ColorAwareMagnifyImage"
import { ProductImageViewerModal } from "@/components/product/product-image-viewer-modal"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"
import { fabricOptions } from "@/data/fabric"

interface IndividualBabyProductConfiguratorProps {
  product: ProductDetail
  productId: number
  onAddToCart: (item: CartItem) => void
  isAddingToCart: boolean
  showColorConfigurator?: boolean
}

/**
 * Individual Baby Product Configurator Component
 * Handles individual baby product customization (swaddles, etc.) with color configurator
 */
export function IndividualBabyProductConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
  showColorConfigurator = true,
}: IndividualBabyProductConfiguratorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    selectedSize,
    setSelectedSize,
    selectedImage,
    setSelectedImage,
    price,
  } = useSimpleProduct(product)

  const {
    selectedFabricId,
    selectedFabricColor,
    isColorApplied,
    setIsColorApplied,
    handleFabricChange,
  } = useColorConfigurator()

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: `${product.id}-${selectedSize}`,
      productId: String(product.id),
      name: product.name,
      image: product.images[0],
      size: selectedSize,
      fabric: selectedFabricId,
      quantity: 1,
      price,
    }
    onAddToCart(cartItem)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="p-6 bg-white border-2 border-[#EED9C4]">
          <h3 className="text-xl font-medium text-foreground mb-6">{product.name}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* Main Product Image with Color Transformation */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 group cursor-pointer">
                {showColorConfigurator && selectedFabricId ? (
                  <ColorAwareMagnifyImage
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fabricId={selectedFabricId}
                    className="h-full w-full"
                    onColorApplied={setIsColorApplied}
                  />
                ) : (
                  <MagnifyImage
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="h-full w-full"
                  />
                )}

                {/* Fullscreen Button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-200"
                  aria-label="Open fullscreen viewer"
                >
                  <Expand className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 max-w-[320px] sm:max-w-[360px]">
                  {product.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      type="button"
                      className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 rounded ${
                        selectedImage === index
                          ? "border-[#EED9C4] opacity-100"
                          : "border-transparent opacity-60"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-cover pointer-events-none"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-2xl font-medium text-foreground mb-4">Dimensions</h4>
              <div className="space-y-6">
                <div>
                  <label className="text-base font-medium text-foreground mb-2 block">Dimensions (in inches)</label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="w-full text-foreground">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.sizes.map((size) => (
                        <SelectItem key={size.name} value={size.name} className="text-foreground">
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Configurator Section */}
                {showColorConfigurator && (
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Fabric Color</label>
                    <Select value={selectedFabricId || "original-color"} onValueChange={(value) => {
                      if (value === "original-color") {
                        handleFabricChange("")
                      } else {
                        handleFabricChange(value)
                      }
                    }}>
                      <SelectTrigger className="w-full text-foreground">
                        <SelectValue placeholder="Select fabric color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original-color">
                          <span className="flex items-center gap-2">
                            <span>Original Color</span>
                          </span>
                        </SelectItem>
                        {fabricOptions.map((fabric) => (
                          <SelectItem key={fabric.id} value={fabric.id}>
                            <span className="flex items-center gap-2">
                              <img
                                src={fabric.image}
                                alt={fabric.name}
                                className="h-5 w-5 rounded object-cover"
                              />
                              <span>{fabric.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFabricColor && (
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-200"
                          style={{ backgroundColor: selectedFabricColor.hex }}
                          title={selectedFabricColor.name}
                        />
                        <span className="text-sm text-foreground/70">{selectedFabricColor.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="sticky top-24 p-6 bg-white border-2 border-[#EED9C4]">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">Total Price</h3>
            <div className="text-2xl font-semibold text-foreground">
              ₹{price.toLocaleString()}{" "}
              <span className="text-sm font-normal text-foreground/70">(inclusive of all taxes)</span>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground py-6 text-lg font-medium"
          >
            {isAddingToCart ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Adding to Cart...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
         
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ProductImageViewerModal
        images={product.images}
        initialIndex={selectedImage}
        productName={product.name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
