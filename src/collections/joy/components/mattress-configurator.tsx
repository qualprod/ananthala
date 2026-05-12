"use client"

import { useState } from "react"
import Image from "next/image"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useMattress } from "@/collections/joy/hooks/use-mattress"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"

interface MattressConfiguratorProps {
  product: ProductDetail
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

// Standard sizes in inches (L x B x H) with price multipliers
const babyStandardSizes = [
  { label: "Regular - 24\" x 48\" x 2\"", value: "regular-24x48x2", dimensions: { length: "24\"", breadth: "48\"", height: "2\"" }, priceMultiplier: 1.0 },
  { label: "Premium - 24\" x 48\" x 4\"", value: "premium-24x48x4", dimensions: { length: "24\"", breadth: "48\"", height: "4\"" }, priceMultiplier: 1.2 },
]

const adultStandardSizes = [
  { label: "Single - 36\" x 72\" x 6\"", value: "36x72x6", dimensions: { length: "36\"", breadth: "72\"", height: "6\"" }, priceMultiplier: 1.0 },
  { label: "Queen - 60\" x 72\" x 6\"", value: "60x72x6", dimensions: { length: "60\"", breadth: "72\"", height: "6\"" }, priceMultiplier: 1.3 },
  { label: "King - 72\" x 78\" x 6\"", value: "72x78x6", dimensions: { length: "72\"", breadth: "78\"", height: "6\"" }, priceMultiplier: 1.6 },
]

// Fabric price multipliers
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

/**
 * Mattress Product Configurator Component
 * Handles mattress-specific customization and cart logic
 */
export function MattressConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
}: MattressConfiguratorProps) {
  const mattressState = useMattress()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [useCustomDimensions, setUseCustomDimensions] = useState(false)
  const standardSizes = product.category === "baby" ? babyStandardSizes : adultStandardSizes
  
  const getProductImages = (): string[] => {
    return product.images && product.images.length > 0 ? product.images : ["/productmattress.jpg"]
  }
  
  const toggleCustomDimensions = () => {
    setUseCustomDimensions(prev => !prev)
  }
  
  const handleStandardSizeChange = (value: string) => {
    const size = standardSizes.find(s => s.value === value)
    if (size) {
      mattressState.setStandardMattressLength(size.dimensions.length)
      mattressState.setStandardMattressBreadth(size.dimensions.breadth)
      mattressState.setStandardMattressHeight(size.dimensions.height)
    }
  }
  
  const getCurrentStandardSize = (): string => {
    const size = standardSizes.find(s => 
      s.dimensions.length === mattressState.standardMattressLength &&
      s.dimensions.breadth === mattressState.standardMattressBreadth &&
      s.dimensions.height === mattressState.standardMattressHeight
    )
    return size?.value || ""
  }
  
  const handleAddToCart = async () => {
    let dimensions = ""
    const isCustom = useCustomDimensions
    
    if (isCustom) {
      dimensions = `${mattressState.mattressLength || ""} x ${mattressState.mattressBreadth || ""} x ${mattressState.mattressHeight || ""}`.trim()
    } else {
      dimensions = `${mattressState.standardMattressLength || ""} x ${mattressState.standardMattressBreadth || ""} x ${mattressState.standardMattressHeight || ""}`.trim()
    }
    
    const sizeInfo = dimensions ? `${dimensions}${mattressState.mattressFabric ? ` - ${fabricOptions.find(f => f.value === mattressState.mattressFabric)?.label || mattressState.mattressFabric}` : ""}${isCustom ? " (Custom)" : ""}` : "Standard"
    
    // Calculate price
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
      dimensionMultiplier = 1.2 // Custom dimensions multiplier
    }
    
    if (mattressState.mattressFabric) {
      fabricMultiplier = fabricMultipliers[mattressState.mattressFabric] || 1.0
    }
    
    const finalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)
    
    const items: CartItem[] = [{
      id: `mattress-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: product.name,
      image: product.images[0] || "/productmattress.jpg",
      size: sizeInfo,
      quantity: 1,
      price: finalPrice,
    }]
    
    onAddToCart(items)
  }
  
  // Calculate total price
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
    dimensionMultiplier = 1.2 // Custom dimensions multiplier
  }
  
  if (mattressState.mattressFabric) {
    fabricMultiplier = fabricMultipliers[mattressState.mattressFabric] || 1.0
  }
  
  const totalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Content - Product Customization */}
      <div className="lg:col-span-8">
        <div className="p-6 bg-white border-2 border-[#EED9C4]">
          <h3 className="text-xl font-medium text-foreground mb-6">{product.name}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <MagnifyImage
                src={getProductImages()[selectedImageIndex] || "/productmattress.jpg"}
                alt={product.name}
              />
              
              {/* Thumbnail Gallery */}
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
            
            {/* Right Side - Dimensions and Fabric */}
            <div>
              <h4 className="text-2xl font-medium text-foreground mb-4">Dimensions & Fabric</h4>
              <div className="space-y-4">
                {/* Toggle between Standard and Custom */}
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
                  /* Standard Dimensions */
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
                      {mattressState.standardMattressLength && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-foreground text-lg">
                            <span>{mattressState.standardMattressLength || "L"}</span>
                            <span>×</span>
                            <span>{mattressState.standardMattressBreadth || "B"}</span>
                            <span>×</span>
                            <span>{mattressState.standardMattressHeight || "H"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Custom Dimensions */
                  <div className="space-y-3">
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Length (inches)</label>
                      <Input
                        type="text"
                        value={mattressState.mattressLength}
                        onChange={(e) => mattressState.setMattressLength(e.target.value)}
                        placeholder="Enter length"
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Breadth (inches)</label>
                      <Input
                        type="text"
                        value={mattressState.mattressBreadth}
                        onChange={(e) => mattressState.setMattressBreadth(e.target.value)}
                        placeholder="Enter breadth"
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-foreground mb-2 block">Height (inches)</label>
                      <Input
                        type="text"
                        value={mattressState.mattressHeight}
                        onChange={(e) => mattressState.setMattressHeight(e.target.value)}
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

      {/* Right Sidebar - Price and Add to Cart */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 p-6 bg-white border-2 border-[#EED9C4]">
          {/* Fabric Selection */}
          <div className="mb-6">
            <label className="text-base font-medium text-foreground mb-3 block">Fabric</label>
            <Select value={mattressState.mattressFabric || ""} onValueChange={mattressState.setMattressFabric}>
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

          {/* Price Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">Total Price</h3>
            <div className="text-2xl font-semibold text-foreground">
              ₹{totalPrice.toLocaleString()} <span className="text-sm font-normal text-foreground/70">(inclusive of all taxes)</span>
            </div>
          </div>
          
          {/* Add to Cart Button */}
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
