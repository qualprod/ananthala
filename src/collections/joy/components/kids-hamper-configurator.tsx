"use client"

import { useState } from "react"
import Image from "next/image"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { ProductImageViewerModal } from "@/components/product/product-image-viewer-modal"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useKidsHamper } from "@/collections/joy/hooks/use-kids-hamper"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"
import { KIDS_HAMPER_ITEM_PRICES } from "@/utils/pricing"

interface KidsHamperConfiguratorProps {
  product: ProductDetail
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

const kidsProducts = [
  {
    id: "mattress",
    name: "Mattress",
    price: KIDS_HAMPER_ITEM_PRICES.mattress,
    images: ["/productmattress.jpg", "/topper.jpg", "/lounger.jpg"],
  },
  {
    id: "pillows",
    name: "Pillows",
    price: KIDS_HAMPER_ITEM_PRICES.pillows,
    images: ["/pillow.jpg", "/bumpers.jpg", "/bedsheet.jpg"],
  },
]

// Standard sizes in inches (L x B x H) with price multipliers
const standardSizes = {
  mattress: [
    { label: "24\" x 48\" x 2\"", value: "24x48x2", dimensions: { length: "24\"", breadth: "48\"", height: "2\"" }, priceMultiplier: 1.0 },
    { label: "24\" x 48\" x 4\"", value: "24x48x4", dimensions: { length: "24\"", breadth: "48\"", height: "4\"" }, priceMultiplier: 1.2 },
  ],
  pillows: [
    { label: "18\" x 4\" x 4\"", value: "18x4x4", dimensions: { length: "18\"", breadth: "4\"", height: "4\"" }, priceMultiplier: 1.0 },
  ],
 
}

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
 * Kids Hamper Product Configurator Component
 * Handles all kids hamper-specific customization and cart logic
 */
export function KidsHamperConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
}: KidsHamperConfiguratorProps) {
  const hamperState = useKidsHamper()
  const [selectedImageIndices, setSelectedImageIndices] = useState<Record<string, number>>({
    mattress: 0,
    pillows: 0,
    
  })
  const [activeViewerItemId, setActiveViewerItemId] = useState<string | null>(null)
  
  // Track whether custom dimensions are enabled for each item
  const [useCustomDimensions, setUseCustomDimensions] = useState<Record<string, boolean>>({
    mattress: false,
    pillows: false,

  })
  
  const getProductImages = (itemId: string): string[] => {
    const productData = kidsProducts.find(p => p.id === itemId)
    return productData ? productData.images : []
  }
  
  const setImageIndex = (itemId: string, index: number) => {
    setSelectedImageIndices(prev => ({ ...prev, [itemId]: index }))
  }

  const closeImageViewer = () => {
    setActiveViewerItemId(null)
  }
  
  const toggleCustomDimensions = (itemId: string) => {
    setUseCustomDimensions(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }
  
  const handleStandardSizeChange = (itemId: string, value: string) => {
    const size = standardSizes[itemId as keyof typeof standardSizes]?.find(s => s.value === value)
    if (size) {
      if (itemId === "mattress") {
        hamperState.setStandardKidsMattressLength(size.dimensions.length)
        hamperState.setStandardKidsMattressBreadth(size.dimensions.breadth)
        hamperState.setStandardKidsMattressHeight(size.dimensions.height)
      } else if (itemId === "pillows") {
        hamperState.setStandardKidsPillowsLength(size.dimensions.length)
        hamperState.setStandardKidsPillowsBreadth(size.dimensions.breadth)
        hamperState.setStandardKidsPillowsHeight(size.dimensions.height)
      } 
    }
  }
  
  const getCurrentStandardSize = (itemId: string): string => {
    if (itemId === "mattress") {
      const sizes = standardSizes.mattress
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardKidsMattressLength &&
        s.dimensions.breadth === hamperState.standardKidsMattressBreadth &&
        s.dimensions.height === hamperState.standardKidsMattressHeight
      )?.value || ""
    } else if (itemId === "pillows") {
      const sizes = standardSizes.pillows
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardKidsPillowsLength &&
        s.dimensions.breadth === hamperState.standardKidsPillowsBreadth &&
        s.dimensions.height === hamperState.standardKidsPillowsHeight
      )?.value || ""
    } 
    return ""
  }
  
  const handleAddToCart = async () => {
    const items: CartItem[] = []
    
    hamperState.kidsHamperItems.forEach((itemId) => {
      const productData = kidsProducts.find(p => p.id === itemId)
      if (productData) {
        let dimensions = ""
        let fabric = ""
        const isCustom = useCustomDimensions[itemId]
        
        if (itemId === "mattress") {
          if (isCustom) {
            dimensions = `${hamperState.kidsMattressLength || ""} x ${hamperState.kidsMattressBreadth || ""} x ${hamperState.kidsMattressHeight || ""}`.trim()
          } else {
            dimensions = `${hamperState.standardKidsMattressLength || ""} x ${hamperState.standardKidsMattressBreadth || ""} x ${hamperState.standardKidsMattressHeight || ""}`.trim()
          }
          fabric = hamperState.kidsMattressFabric || ""
        } else if (itemId === "pillows") {
          if (isCustom) {
            dimensions = `${hamperState.kidsPillowsLength || ""} x ${hamperState.kidsPillowsBreadth || ""} x ${hamperState.kidsPillowsHeight || ""}`.trim()
          } else {
            dimensions = `${hamperState.standardKidsPillowsLength || ""} x ${hamperState.standardKidsPillowsBreadth || ""} x ${hamperState.standardKidsPillowsHeight || ""}`.trim()
          }
          fabric = hamperState.kidsPillowsFabric || ""
        }
        
        const sizeInfo = dimensions ? `${dimensions}${fabric ? ` - ${fabricOptions.find(f => f.value === fabric)?.label || fabric}` : ""}${isCustom ? " (Custom)" : ""}` : "Standard"
        
        // Calculate price
        let basePrice = productData.price
        let dimensionMultiplier = 1.0
        let fabricMultiplier = 1.0
        
        if (!isCustom) {
          const currentSizeValue = getCurrentStandardSize(itemId)
          if (currentSizeValue) {
            const size = standardSizes[itemId as keyof typeof standardSizes]?.find(s => s.value === currentSizeValue)
            if (size && size.priceMultiplier) {
              dimensionMultiplier = size.priceMultiplier
            }
          }
        } else {
          // For custom dimensions, calculate multiplier based on area
          // This is a simplified calculation - you can adjust the formula
          dimensionMultiplier = 1.2 // Base custom multiplier
        }
        
        if (fabric) {
          fabricMultiplier = fabricMultipliers[fabric] || 1.0
        }
        
        const finalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)
        
        items.push({
          id: `kids-${itemId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: `JOY ${productData.name}`,
          image: productData.image,
          size: sizeInfo,
          quantity: 1,
          price: finalPrice,
        })
      }
    })
    
    onAddToCart(items)
  }
  
  // Calculate total price
  const totalPrice = hamperState.kidsHamperItems.reduce((sum, itemId) => {
    const productData = kidsProducts.find(p => p.id === itemId)
    if (!productData) return sum
    
    let basePrice = productData.price
    let dimensionMultiplier = 1.0
    let fabricMultiplier = 1.0
    
    const isCustom = useCustomDimensions[itemId]
    
    if (!isCustom) {
      const currentSizeValue = getCurrentStandardSize(itemId)
      if (currentSizeValue) {
        const size = standardSizes[itemId as keyof typeof standardSizes]?.find(s => s.value === currentSizeValue)
        if (size && size.priceMultiplier) {
          dimensionMultiplier = size.priceMultiplier
        }
      }
    } else {
      dimensionMultiplier = 1.2 // Custom dimensions multiplier
    }
    
    if (itemId === "mattress" && hamperState.kidsMattressFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.kidsMattressFabric] || 1.0
    } else if (itemId === "pillows" && hamperState.kidsPillowsFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.kidsPillowsFabric] || 1.0
    } 
    
    return sum + Math.round(basePrice * dimensionMultiplier * fabricMultiplier)
  }, 0)

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Content - All Items Customization */}
      <div className="lg:col-span-9 space-y-8">
        {/* Mattress Customization */}
        {hamperState.kidsHamperItems.includes("mattress") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Mattress</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                <div className="cursor-pointer" onClick={() => setActiveViewerItemId("mattress")}>
                  <MagnifyImage
                    src={getProductImages("mattress")[selectedImageIndices.mattress] || "/productmattress.jpg"}
                    alt="JOY Mattress"
                    enableHoverZoom={false}
                    enableMobileTapZoom={false}
                    showMobileHint={false}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {getProductImages("mattress").length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {getProductImages("mattress").map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex("mattress", index)}
                        type="button"
                        className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                          selectedImageIndices.mattress === index
                            ? "border-[#EED9C4] opacity-100"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Mattress view ${index + 1}`}
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
                      onClick={() => toggleCustomDimensions("mattress")}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        !useCustomDimensions.mattress
                          ? "bg-[#EED9C4] text-foreground"
                          : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCustomDimensions("mattress")}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        useCustomDimensions.mattress
                          ? "bg-[#EED9C4] text-foreground"
                          : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  
                  {!useCustomDimensions.mattress ? (
                    /* Standard Dimensions */
                    <>
                      <div>
                        <label className="text-base font-medium text-foreground mb-2 block">Standard Size</label>
                        <Select 
                          value={getCurrentStandardSize("mattress")} 
                          onValueChange={(value) => handleStandardSizeChange("mattress", value)}
                        >
                          <SelectTrigger className="w-full text-foreground">
                            <SelectValue placeholder="Select standard size" />
                          </SelectTrigger>
                          <SelectContent>
                            {standardSizes.mattress.map((size) => (
                              <SelectItem key={size.value} value={size.value} className="text-foreground">
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {hamperState.standardKidsMattressLength && (
                          <div className="mt-2 text-sm text-foreground/70">
                            Dimensions: {hamperState.standardKidsMattressLength} × {hamperState.standardKidsMattressBreadth} × {hamperState.standardKidsMattressHeight}
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
                          value={hamperState.kidsMattressLength}
                          onChange={(e) => hamperState.setKidsMattressLength(e.target.value)}
                          placeholder="Enter length"
                          className="text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-base font-medium text-foreground mb-2 block">Breadth (inches)</label>
                        <Input
                          type="text"
                          value={hamperState.kidsMattressBreadth}
                          onChange={(e) => hamperState.setKidsMattressBreadth(e.target.value)}
                          placeholder="Enter breadth"
                          className="text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-base font-medium text-foreground mb-2 block">Height (inches)</label>
                        <Input
                          type="text"
                          value={hamperState.kidsMattressHeight}
                          onChange={(e) => hamperState.setKidsMattressHeight(e.target.value)}
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
        )}

        {/* Pillows Customization */}
        {hamperState.kidsHamperItems.includes("pillows") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Pillows</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                <div className="cursor-pointer" onClick={() => setActiveViewerItemId("pillows")}>
                  <MagnifyImage
                    src={getProductImages("pillows")[selectedImageIndices.pillows] || "/pillow.jpg"}
                    alt="JOY Pillows"
                    enableHoverZoom={false}
                    enableMobileTapZoom={false}
                    showMobileHint={false}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {getProductImages("pillows").length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {getProductImages("pillows").map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex("pillows", index)}
                        type="button"
                        className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                          selectedImageIndices.pillows === index
                            ? "border-[#EED9C4] opacity-100"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Pillows view ${index + 1}`}
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
                      onClick={() => toggleCustomDimensions("pillows")}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        !useCustomDimensions.pillows
                          ? "bg-[#EED9C4] text-foreground"
                          : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCustomDimensions("pillows")}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        useCustomDimensions.pillows
                          ? "bg-[#EED9C4] text-foreground"
                          : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  
                  {!useCustomDimensions.pillows ? (
                    /* Standard Dimensions */
                    <>
                      <div>
                        <label className="text-base font-medium text-foreground mb-2 block">Standard Size</label>
                        <Select 
                          value={getCurrentStandardSize("pillows")} 
                          onValueChange={(value) => handleStandardSizeChange("pillows", value)}
                        >
                          <SelectTrigger className="w-full text-foreground">
                            <SelectValue placeholder="Select standard size" />
                          </SelectTrigger>
                          <SelectContent>
                            {standardSizes.pillows.map((size) => (
                              <SelectItem key={size.value} value={size.value} className="text-foreground">
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {hamperState.standardKidsPillowsLength && (
                          <div className="mt-2 text-sm text-foreground/70">
                            Dimensions: {hamperState.standardKidsPillowsLength} × {hamperState.standardKidsPillowsBreadth} × {hamperState.standardKidsPillowsHeight}
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
                          value={hamperState.kidsPillowsLength}
                          onChange={(e) => hamperState.setKidsPillowsLength(e.target.value)}
                          placeholder="Enter length"
                          className="text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-base font-medium text-foreground mb-2 block">Breadth (inches)</label>
                        <Input
                          type="text"
                          value={hamperState.kidsPillowsBreadth}
                          onChange={(e) => hamperState.setKidsPillowsBreadth(e.target.value)}
                          placeholder="Enter breadth"
                          className="text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-base font-medium text-foreground mb-2 block">Height (inches)</label>
                        <Input
                          type="text"
                          value={hamperState.kidsPillowsHeight}
                          onChange={(e) => hamperState.setKidsPillowsHeight(e.target.value)}
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
        )}
      </div>

      {/* Right Sidebar - Hamper Includes */}
      <div className="lg:col-span-3">
        <div className="sticky top-24 p-6 bg-white border-2 border-[#EED9C4]">
          <h3 className="text-xl font-semibold text-foreground mb-4">Hamper Includes:</h3>
          <div className="space-y-3">
            {kidsProducts.map((product) => (
              <label key={product.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hamperState.kidsHamperItems.includes(product.id)}
                  onChange={() => hamperState.toggleKidsHamperItem(product.id)}
                  className="w-5 h-5 text-[#EED9C4] border-foreground/30 rounded focus:ring-[#EED9C4]"
                />
                <span className="text-foreground font-medium">{product.name}</span>
              </label>
            ))}
          </div>
          
          {/* Fabric Selection */}
          <div className="mt-6">
            <label className="text-base font-medium text-foreground mb-3 block">Fabric</label>
            <Select
              value={hamperState.kidsMattressFabric || hamperState.kidsPillowsFabric || ""}
              onValueChange={(value) => {
                hamperState.setKidsMattressFabric(value)
                hamperState.setKidsPillowsFabric(value)
              }}
            >
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
          <div className="mt-6 pt-6 border-t border-[#EED9C4]">
            <h3 className="text-lg font-medium text-foreground mb-2">Total Price</h3>
            <div className="text-2xl font-semibold text-foreground">
              ₹{totalPrice.toLocaleString()} <span className="text-sm font-normal text-foreground/70">(inclusive of all taxes)</span>
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <Button 
            className="w-full mt-6 bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={isAddingToCart || hamperState.kidsHamperItems.length === 0}
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
    {activeViewerItemId && (
      <ProductImageViewerModal
        images={getProductImages(activeViewerItemId)}
        initialIndex={selectedImageIndices[activeViewerItemId] ?? 0}
        productName={kidsProducts.find((item) => item.id === activeViewerItemId)?.name || product.name}
        isOpen={Boolean(activeViewerItemId)}
        onClose={closeImageViewer}
      />
    )}
    </>
  )
}
