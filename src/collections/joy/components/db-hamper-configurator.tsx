"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"
import { fabricOptions } from "@/data/fabric"

export interface DbHamperItemVariant {
  weight: number
  length: number
  width: number
  height: number
  stock: number
}

export interface DbHamperItem {
  name: string
  imageUrls: string[]
  variants: DbHamperItemVariant[]
}

interface DbHamperConfiguratorProps {
  product: ProductDetail
  hamperItems: DbHamperItem[]
  hamperPrice: number
  hamperFabric: string
  hamperFabricOptions?: string[]
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

export function DbHamperConfigurator({
  product,
  hamperItems,
  hamperPrice,
  hamperFabric,
  hamperFabricOptions = [],
  onAddToCart,
  isAddingToCart,
}: DbHamperConfiguratorProps) {
  const [selectedImageIndices, setSelectedImageIndices] = useState<Record<number, number>>({})
  const [selectedVariantIndices, setSelectedVariantIndices] = useState<Record<number, number>>({})
  const [useCustomDimensions, setUseCustomDimensions] = useState<Record<number, boolean>>({})
  const [customDimensions, setCustomDimensions] = useState<
    Record<number, { length: string; width: string; height: string }>
  >({})
  const [selectedFabric, setSelectedFabric] = useState<string>("")

  const availableHamperFabrics = useMemo(
    () =>
      Array.from(
        new Set([...(hamperFabricOptions || []), ...(hamperFabric ? [hamperFabric] : [])].filter(Boolean)),
      ),
    [hamperFabric, hamperFabricOptions],
  )

  useEffect(() => {
    if (!selectedFabric && availableHamperFabrics.length > 0) {
      setSelectedFabric(availableHamperFabrics[0])
    }
  }, [availableHamperFabrics, selectedFabric])

  const normalizedItems = useMemo(() => {
    return (hamperItems || [])
      .filter((item) => item?.name)
      .map((item) => ({
        name: item.name,
        imageUrls: Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls : ["/placeholder.svg"],
        variants: Array.isArray(item.variants) ? item.variants : [],
      }))
  }, [hamperItems])

  const handleAddToCart = () => {
    const cover = product.images?.[0] || "/placeholder.svg"
    const fabricLabel =
      fabricOptions.find((f) => f.id === selectedFabric)?.name ||
      selectedFabric ||
      availableHamperFabrics[0] ||
      hamperFabric
    const sizeParts = [normalizedItems.map((i) => i.name).join(", ")].filter(Boolean)
    const sizeInfo = sizeParts.join(" | ") || "Hamper"
    const items: CartItem[] = [
      {
        id: `hamper-${product.id}-${Date.now()}`,
        name: product.name,
        image: cover,
        size: sizeInfo,
        fabric: fabricLabel || "Standard",
        quantity: 1,
        price: hamperPrice,
      },
    ]
    onAddToCart(items)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Content - Items */}
      <div className="lg:col-span-9 space-y-8">
        {normalizedItems.map((item, itemIndex) => {
          const images = item.imageUrls
          const imageIndex = selectedImageIndices[itemIndex] ?? 0
          const variants = item.variants
          const selectedVariantIndex = selectedVariantIndices[itemIndex] ?? 0
          const selectedVariant = variants[selectedVariantIndex]
          const isCustom = Boolean(useCustomDimensions[itemIndex])
          const custom = customDimensions[itemIndex] || { length: "", width: "", height: "" }

          return (
            <div key={`${item.name}-${itemIndex}`} className="p-6 bg-white border-2 border-[#EED9C4]">
              <h3 className="text-xl font-medium text-foreground mb-6">{item.name}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side - Images */}
                <div className="space-y-4">
                <MagnifyImage
                  src={images[imageIndex] || "/placeholder.svg"}
                  alt={item.name}
                  className="rounded-lg bg-gray-50"
                />

                  {images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {images.slice(0, 5).map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndices((prev) => ({ ...prev, [itemIndex]: idx }))}
                          type="button"
                          className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                            imageIndex === idx ? "border-[#EED9C4] opacity-100" : "border-transparent opacity-60"
                          }`}
                        >
                          <Image src={src} alt={`${item.name} ${idx + 1}`} fill className="object-cover pointer-events-none" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Dimensions / Variant selection */}
                <div className="space-y-4">
                  <h4 className="text-2xl font-medium text-foreground mb-2">Dimensions</h4>

                  {/* Standard / Custom toggle (match single product UI) */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomDimensions((prev) => ({ ...prev, [itemIndex]: false }))
                      }}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        !isCustom ? "bg-[#EED9C4] text-foreground" : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomDimensions((prev) => ({ ...prev, [itemIndex]: true }))
                      }}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        isCustom ? "bg-[#EED9C4] text-foreground" : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="text-sm text-foreground/70 border border-[#EED9C4] rounded-md p-3">
                      No variants available for this item.
                    </div>
                  ) : !isCustom ? (
                    <div className="space-y-3">
                      <label className="block mb-1 text-black text-lg">Select Size</label>
                      <select
                        className="w-full border border-[#EED9C4] rounded-md px-3 py-2 bg-white text-sm"
                        value={selectedVariantIndex}
                        onChange={(event) =>
                          setSelectedVariantIndices((prev) => ({ ...prev, [itemIndex]: Number(event.target.value) }))
                        }
                      >
                        {variants.map((v, vIdx) => {
                          const label = `${v.length}x${v.width}x${v.height} cm`
                          return (
                            <option key={`${label}-${vIdx}`} value={vIdx}>
                              {label}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block mb-1 text-black text-lg">Custom Size (cm)</label>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          value={custom.length}
                          onChange={(e) =>
                            setCustomDimensions((prev) => ({
                              ...prev,
                              [itemIndex]: { ...custom, length: e.target.value },
                            }))
                          }
                          placeholder="Length"
                        />
                        <Input
                          value={custom.width}
                          onChange={(e) =>
                            setCustomDimensions((prev) => ({
                              ...prev,
                              [itemIndex]: { ...custom, width: e.target.value },
                            }))
                          }
                          placeholder="Width"
                        />
                        <Input
                          value={custom.height}
                          onChange={(e) =>
                            setCustomDimensions((prev) => ({
                              ...prev,
                              [itemIndex]: { ...custom, height: e.target.value },
                            }))
                          }
                          placeholder="Height"
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-3">
        <div className="sticky top-24 p-7 bg-white border-2 border-[#EED9C4]">
          <h3 className="text-xl font-semibold text-foreground mb-4">Hamper Includes:</h3>
          <div className="space-y-3">
            {normalizedItems.map((item, idx) => (
              <label key={`${item.name}-${idx}`} className="flex items-center space-x-3">
                <input type="checkbox" checked disabled className="w-5 h-5 text-[#EED9C4] border-foreground/30 rounded" />
                <span className="text-foreground font-medium">{item.name}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {/* Fabric (single option behaves like single products with 1 available fabric) */}
            {availableHamperFabrics.length > 0 && (
              <div>
                <label className="text-base font-medium text-foreground mb-2 block">Fabric</label>
                <Select value={selectedFabric || undefined} onValueChange={setSelectedFabric}>
                  <SelectTrigger className="w-full text-foreground ">
                    <SelectValue placeholder="Select fabric" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHamperFabrics.map((fabricId) => {
                      const fabricOption = fabricOptions.find((fabric) => fabric.id === fabricId)
                      return (
                        <SelectItem key={fabricId} value={fabricId}>
                          <span className="flex items-center gap-2">
                            <img
                              src={fabricOption?.image || "/placeholder.svg"}
                              alt={fabricOption?.name || fabricId}
                              className="h-6 w-6 rounded object-cover"
                            />
                            <span>{fabricOption?.name || fabricId}</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

          </div>

          <div className="mt-6 pt-6 border-t border-[#EED9C4]">
            <h3 className="text-lg font-medium text-foreground mb-2">Total Price</h3>
            <div className="text-2xl font-semibold text-foreground">
              ₹{Number(hamperPrice || 0).toLocaleString()}{" "}
              <span className="text-sm font-normal text-foreground/70">(inclusive of all taxes)</span>
            </div>
          </div>

          <Button
            className="w-full mt-6 bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={isAddingToCart || normalizedItems.length === 0}
          >
            {isAddingToCart ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Adding to Cart...
              </>
            ) : (
              "Add to Cart"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

