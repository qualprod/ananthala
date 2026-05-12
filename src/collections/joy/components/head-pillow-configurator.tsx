"use client"

import { useState } from "react"
import Image from "next/image"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useHeadPillow } from "@/collections/joy/hooks/use-head-pillow"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"

interface HeadPillowConfiguratorProps {
  product: ProductDetail
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

const babyStandardSizes = [
  { label: "9\" x 13\" x 1\"", value: "9x13x1", dimensions: { length: "9\"", breadth: "13\"", height: "1\"" }, priceMultiplier: 1.0 },
]

const adultStandardSizes = [
  { label: "18\" x 28\" x 2.5\"", value: "18x28x2.5", dimensions: { length: "18\"", breadth: "28\"", height: "2.5\"" }, priceMultiplier: 1.0 },
]

const fabricMultipliers: Record<string, number> = {
  "gingham-beige": 1.0,
  "gingham-blue": 1.05,
  "gingham-pink": 1.1,
}

const fabricOptions = [
  { value: "gingham-beige", label: "Gingham Beige", image: "/gingham_small_beige.jpeg" },
  { value: "gingham-blue", label: "Gingham Blue", image: "/gingham_small_blue.jpeg" },
  { value: "gingham-pink", label: "Gingham Pink", image: "/gingham_small_pink.jpeg" },
]

export function HeadPillowConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
}: HeadPillowConfiguratorProps) {
  const pillowState = useHeadPillow()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [useCustomDimensions, setUseCustomDimensions] = useState(false)
  const standardSizes = product.category === "baby" ? babyStandardSizes : adultStandardSizes
  
  const getProductImages = (): string[] => {
    return product.images && product.images.length > 0 ? product.images : ["/pillow.jpg"]
  }
  
  const toggleCustomDimensions = () => {
    setUseCustomDimensions(prev => !prev)
  }
  
  const handleStandardSizeChange = (value: string) => {
    const size = standardSizes.find(s => s.value === value)
    if (size) {
      pillowState.setStandardPillowLength(size.dimensions.length)
      pillowState.setStandardPillowBreadth(size.dimensions.breadth)
      pillowState.setStandardPillowHeight(size.dimensions.height)
    }
  }
  
  const getCurrentStandardSize = (): string => {
    const size = standardSizes.find(s => 
      s.dimensions.length === pillowState.standardPillowLength &&
      s.dimensions.breadth === pillowState.standardPillowBreadth &&
      s.dimensions.height === pillowState.standardPillowHeight
    )
    return size?.value || ""
  }
  
  const handleAddToCart = async () => {
    let dimensions = ""
    const isCustom = useCustomDimensions
    
    if (isCustom) {
      dimensions = `${pillowState.pillowLength || ""} x ${pillowState.pillowBreadth || ""} x ${pillowState.pillowHeight || ""}`.trim()
    } else {
      dimensions = `${pillowState.standardPillowLength || ""} x ${pillowState.standardPillowBreadth || ""} x ${pillowState.standardPillowHeight || ""}`.trim()
    }
    
    const sizeInfo = dimensions ? `${dimensions}${pillowState.pillowFabric ? ` - ${fabricOptions.find(f => f.value === pillowState.pillowFabric)?.label || pillowState.pillowFabric}` : ""}${isCustom ? " (Custom)" : ""}` : "Standard"
    
    let basePrice = product.price
    let dimensionMultiplier = 1.0
    let fabricMultiplier = 1.0
    
    if (!isCustom) {
      const currentSizeValue = getCurrentStandardSize()
      if (currentSizeValue) {
        const size = standardSizes.find(s => s.value === currentSizeValue)
        if (size && size.priceMultiplier) {
          dimensionMultiplier = size.priceMultiplier
        }
      }
    } else {
      dimensionMultiplier = 1.2
    }
    
    if (pillowState.pillowFabric) {
      fabricMultiplier = fabricMultipliers[pillowState.pillowFabric] || 1.0
    }
    
    const finalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)
    
    const items: CartItem[] = [{
      id: `head-pillow-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: product.name,
      image: product.images[0] || "/pillow.jpg",
      size: sizeInfo,
      quantity: 1,
      price: finalPrice,
    }]
    
    onAddToCart(items)
  }
  
  let basePrice = product.price
  let dimensionMultiplier = 1.0
  let fabricMultiplier = 1.0
  
  if (!useCustomDimensions) {
    const currentSizeValue = getCurrentStandardSize()
    if (currentSizeValue) {
      const size = standardSizes.find(s => s.value === currentSizeValue)
      if (size && size.priceMultiplier) {
        dimensionMultiplier = size.priceMultiplier
      }
    }
  } else {
    dimensionMultiplier = 1.2
  }
  
  if (pillowState.pillowFabric) {
    fabricMultiplier = fabricMultipliers[pillowState.pillowFabric] || 1.0
  }
  
  const totalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="p-6 bg-white border-2 border-[#EED9C4]">
          <h3 className="text-xl font-medium text-foreground mb-6">{product.name}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <MagnifyImage
                src={getProductImages()[selectedImageIndex] || "/pillow.jpg"}
                alt={product.name}
              />
              
              {getProductImages().length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {getProductImages().map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      type="button"
                      className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                        selectedImageIndex === index
                          ? "border-[#EED9C4] opacity-100"
                          : "border-transparent opacity-60"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-cover pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="text-2xl font-medium text-foreground mb-4">Dimensions & Fabric</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={toggleCustomDimensions}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      !useCustomDimensions
                        ? "bg-[#EED9C4] text-foreground"
                        : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={toggleCustomDimensions}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      useCustomDimensions
                        ? "bg-[#EED9C4] text-foreground"
                        : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                
                {!useCustomDimensions ? (
                  <>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Dimensions(in inches)</label>
                      <Select 
                        value={getCurrentStandardSize()} 
                        onValueChange={handleStandardSizeChange}
                      >
                        <SelectTrigger className="w-full text-foreground">
                          <SelectValue placeholder="Select standard size" />
                        </SelectTrigger>
                        <SelectContent>
                          {standardSizes.map((size) => (
                            <SelectItem key={size.value} value={size.value} className="text-foreground">
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {pillowState.standardPillowLength && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-foreground text-lg">
                            <span>{pillowState.standardPillowLength || "L"}</span>
                            <span>×</span>
                            <span>{pillowState.standardPillowBreadth || "B"}</span>
                            <span>×</span>
                            <span>{pillowState.standardPillowHeight || "H"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Length (inches)</label>
                      <Input
                        type="text"
                        value={pillowState.pillowLength}
                        onChange={(e) => pillowState.setPillowLength(e.target.value)}
                        placeholder="Enter length"
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Breadth (inches)</label>
                      <Input
                        type="text"
                        value={pillowState.pillowBreadth}
                        onChange={(e) => pillowState.setPillowBreadth(e.target.value)}
                        placeholder="Enter breadth"
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Height (inches)</label>
                      <Input
                        type="text"
                        value={pillowState.pillowHeight}
                        onChange={(e) => pillowState.setPillowHeight(e.target.value)}
                        placeholder="Enter height"
                        className="text-foreground"
                      />
                    </div>
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
            <label className="text-base font-medium text-foreground mb-3 block">Fabric</label>
            <Select value={pillowState.pillowFabric || ""} onValueChange={pillowState.setPillowFabric}>
              <SelectTrigger className="w-full text-foreground py-3">
                <SelectValue placeholder="Select fabric" />
              </SelectTrigger>
              <SelectContent>
                {fabricOptions.map((fabric) => (
                  <SelectItem key={fabric.value} value={fabric.value} className="text-foreground">
                    <span className="flex items-center gap-3">
                      <Image
                        src={fabric.image}
                        alt={fabric.label}
                        width={28}
                        height={28}
                        className="rounded-none"
                      />
                      <span className="text-base">{fabric.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">Total Price</h3>
            <div className="text-2xl font-semibold text-foreground">
              ₹{totalPrice.toLocaleString()} <span className="text-sm font-normal text-foreground/70">(inclusive of all taxes)</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
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
