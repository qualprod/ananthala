"use client"

import { useState } from "react"
import Image from "next/image"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useLounger } from "@/collections/joy/hooks/use-lounger"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"

interface LoungerConfiguratorProps {
  product: ProductDetail
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

const babyStandardSizes = [
  { label: "18\" x 30\" x 2\"", value: "18x30x2", dimensions: { length: "18\"", breadth: "30\"", height: "2\"" }, priceMultiplier: 1.0 },
]

const adultStandardSizes = [
  { label: "20\" x 30\" x 4\"", value: "20x30x4", dimensions: { length: "20\"", breadth: "30\"", height: "4\"" }, priceMultiplier: 1.0 },
  { label: "24\" x 36\" x 5\"", value: "24x36x5", dimensions: { length: "24\"", breadth: "36\"", height: "5\"" }, priceMultiplier: 1.25 },
  { label: "28\" x 40\" x 6\"", value: "28x40x6", dimensions: { length: "28\"", breadth: "40\"", height: "6\"" }, priceMultiplier: 1.5 },
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

export function LoungerConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
}: LoungerConfiguratorProps) {
  const loungerState = useLounger()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [useCustomDimensions, setUseCustomDimensions] = useState(false)
  const standardSizes = product.category === "baby" ? babyStandardSizes : adultStandardSizes
  
  const getProductImages = (): string[] => {
    return product.images && product.images.length > 0 ? product.images : ["/lounger.jpg"]
  }
  
  const toggleCustomDimensions = () => {
    setUseCustomDimensions(prev => !prev)
  }
  
  const handleStandardSizeChange = (value: string) => {
    const size = standardSizes.find(s => s.value === value)
    if (size) {
      loungerState.setStandardLoungerLength(size.dimensions.length)
      loungerState.setStandardLoungerBreadth(size.dimensions.breadth)
      loungerState.setStandardLoungerHeight(size.dimensions.height)
    }
  }
  
  const getCurrentStandardSize = (): string => {
    const size = standardSizes.find(s => 
      s.dimensions.length === loungerState.standardLoungerLength &&
      s.dimensions.breadth === loungerState.standardLoungerBreadth &&
      s.dimensions.height === loungerState.standardLoungerHeight
    )
    return size?.value || ""
  }
  
  const handleAddToCart = async () => {
    let dimensions = ""
    const isCustom = useCustomDimensions
    
    if (isCustom) {
      dimensions = `${loungerState.loungerLength || ""} x ${loungerState.loungerBreadth || ""} x ${loungerState.loungerHeight || ""}`.trim()
    } else {
      dimensions = `${loungerState.standardLoungerLength || ""} x ${loungerState.standardLoungerBreadth || ""} x ${loungerState.standardLoungerHeight || ""}`.trim()
    }
    
    const sizeInfo = dimensions ? `${dimensions}${loungerState.loungerFabric ? ` - ${fabricOptions.find(f => f.value === loungerState.loungerFabric)?.label || loungerState.loungerFabric}` : ""}${isCustom ? " (Custom)" : ""}` : "Standard"
    
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
    
    if (loungerState.loungerFabric) {
      fabricMultiplier = fabricMultipliers[loungerState.loungerFabric] || 1.0
    }
    
    const finalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)
    
    const items: CartItem[] = [{
      id: `lounger-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: product.name,
      image: product.images[0] || "/lounger.jpg",
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
  
  if (loungerState.loungerFabric) {
    fabricMultiplier = fabricMultipliers[loungerState.loungerFabric] || 1.0
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
                src={getProductImages()[selectedImageIndex] || "/lounger.jpg"}
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
                      {loungerState.standardLoungerLength && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-foreground text-lg">
                            <span>{loungerState.standardLoungerLength || "L"}</span>
                            <span>×</span>
                            <span>{loungerState.standardLoungerBreadth || "B"}</span>
                            <span>×</span>
                            <span>{loungerState.standardLoungerHeight || "H"}</span>
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
                        value={loungerState.loungerLength}
                        onChange={(e) => loungerState.setLoungerLength(e.target.value)}
                        placeholder="Enter length"
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Breadth (inches)</label>
                      <Input
                        type="text"
                        value={loungerState.loungerBreadth}
                        onChange={(e) => loungerState.setLoungerBreadth(e.target.value)}
                        placeholder="Enter breadth"
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Height (inches)</label>
                      <Input
                        type="text"
                        value={loungerState.loungerHeight}
                        onChange={(e) => loungerState.setLoungerHeight(e.target.value)}
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
            <Select value={loungerState.loungerFabric || ""} onValueChange={loungerState.setLoungerFabric}>
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
