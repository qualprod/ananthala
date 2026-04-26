"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { ProductImageViewerModal } from "@/components/product/product-image-viewer-modal"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useBabyHamper } from "@/collections/joy/hooks/use-baby-hamper"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"
import { BABY_HAMPER_ITEM_PRICES } from "@/utils/pricing"

interface BabyHamperConfiguratorProps {
  product: ProductDetail
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

const babyProducts = [
  { id: "mattress", name: "Mattress", price: BABY_HAMPER_ITEM_PRICES.mattress, image: "/productmattress.jpg" },
  { id: "topper", name: "Topper", price: BABY_HAMPER_ITEM_PRICES.topper, image: "/topper.jpg" },
  { id: "lounger", name: "Lounger", price: BABY_HAMPER_ITEM_PRICES.lounger, image: "/lounger.jpg" },
  { id: "head-pillow", name: "Head Pillow", price: BABY_HAMPER_ITEM_PRICES["head-pillow"], image: "/pillow.jpg" },
  { id: "pillow-bumpers", name: "Pillow Bumpers", price: BABY_HAMPER_ITEM_PRICES["pillow-bumpers"], image: "/bumpers.jpg" },
]

// Standard sizes in inches (L x B x H) with price multipliers
const standardSizes = {
  mattress: [
    { label: "Regular - 24\" x 48\" x 2\"", value: "regular-24x48x2", dimensions: { length: "24\"", breadth: "48\"", height: "2\"" }, priceMultiplier: 1.0 },
    { label: "Premium - 24\" x 48\" x 4\"", value: "premium-24x48x4", dimensions: { length: "24\"", breadth: "48\"", height: "4\"" }, priceMultiplier: 1.2 },
  ],
  topper: [
    { label: "16\" x 26\" x 1.5\"", value: "16x26x1.5", dimensions: { length: "16\"", breadth: "26\"", height: "1.5\"" }, priceMultiplier: 1.0 },
  ],
  lounger: [
    { label: "18\" x 30\" x 2\"", value: "18x30x2", dimensions: { length: "18\"", breadth: "30\"", height: "2\"" }, priceMultiplier: 1.0 },
  ],
  "head-pillow": [
    { label: "9\" x 13\" x 1\"", value: "9x13x1", dimensions: { length: "9\"", breadth: "13\"", height: "1\"" }, priceMultiplier: 1.0 },
  ],
  "pillow-bumpers": [
    { label: "18\" x 4\" x 4\" (Set of 2)", value: "18x4x4", dimensions: { length: "18\"", breadth: "4\"", height: "4\"" }, priceMultiplier: 1.0 },
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
 * Baby Hamper Product Configurator Component
 * Handles all baby hamper-specific customization and cart logic
 */
export function BabyHamperConfigurator({
  product,
  onAddToCart,
  isAddingToCart,
}: BabyHamperConfiguratorProps) {
  const hamperState = useBabyHamper()
  const [selectedImageIndices, setSelectedImageIndices] = useState<Record<string, number>>({
    mattress: 0,
    topper: 0,
    lounger: 0,
    "head-pillow": 0,
    "pillow-bumpers": 0,
  })
  const [activeViewerItemId, setActiveViewerItemId] = useState<string | null>(null)

  useEffect(() => {
    const defaultMattress = standardSizes.mattress[0]?.dimensions
    if (defaultMattress && !hamperState.standardLength && !hamperState.standardBreadth && !hamperState.standardHeight) {
      hamperState.setStandardLength(defaultMattress.length)
      hamperState.setStandardBreadth(defaultMattress.breadth)
      hamperState.setStandardHeight(defaultMattress.height)
    }

    const defaultTopper = standardSizes.topper[0]?.dimensions
    if (defaultTopper && !hamperState.standardTopperLength && !hamperState.standardTopperBreadth && !hamperState.standardTopperHeight) {
      hamperState.setStandardTopperLength(defaultTopper.length)
      hamperState.setStandardTopperBreadth(defaultTopper.breadth)
      hamperState.setStandardTopperHeight(defaultTopper.height)
    }

    const defaultLounger = standardSizes.lounger[0]?.dimensions
    if (defaultLounger && !hamperState.standardLoungerLength && !hamperState.standardLoungerBreadth && !hamperState.standardLoungerHeight) {
      hamperState.setStandardLoungerLength(defaultLounger.length)
      hamperState.setStandardLoungerBreadth(defaultLounger.breadth)
      hamperState.setStandardLoungerHeight(defaultLounger.height)
    }

    const defaultPillow = standardSizes["head-pillow"][0]?.dimensions
    if (defaultPillow && !hamperState.standardPillowLength && !hamperState.standardPillowBreadth && !hamperState.standardPillowHeight) {
      hamperState.setStandardPillowLength(defaultPillow.length)
      hamperState.setStandardPillowBreadth(defaultPillow.breadth)
      hamperState.setStandardPillowHeight(defaultPillow.height)
    }

    const defaultBumper = standardSizes["pillow-bumpers"][0]?.dimensions
    if (defaultBumper && !hamperState.standardBumperLength && !hamperState.standardBumperBreadth && !hamperState.standardBumperHeight) {
      hamperState.setStandardBumperLength(defaultBumper.length)
      hamperState.setStandardBumperBreadth(defaultBumper.breadth)
      hamperState.setStandardBumperHeight(defaultBumper.height)
    }
  }, [
    hamperState.standardLength,
    hamperState.standardBreadth,
    hamperState.standardHeight,
    hamperState.standardTopperLength,
    hamperState.standardTopperBreadth,
    hamperState.standardTopperHeight,
    hamperState.standardLoungerLength,
    hamperState.standardLoungerBreadth,
    hamperState.standardLoungerHeight,
    hamperState.standardPillowLength,
    hamperState.standardPillowBreadth,
    hamperState.standardPillowHeight,
    hamperState.standardBumperLength,
    hamperState.standardBumperBreadth,
    hamperState.standardBumperHeight,
    hamperState.setStandardLength,
    hamperState.setStandardBreadth,
    hamperState.setStandardHeight,
    hamperState.setStandardTopperLength,
    hamperState.setStandardTopperBreadth,
    hamperState.setStandardTopperHeight,
    hamperState.setStandardLoungerLength,
    hamperState.setStandardLoungerBreadth,
    hamperState.setStandardLoungerHeight,
    hamperState.setStandardPillowLength,
    hamperState.setStandardPillowBreadth,
    hamperState.setStandardPillowHeight,
    hamperState.setStandardBumperLength,
    hamperState.setStandardBumperBreadth,
    hamperState.setStandardBumperHeight,
  ])
  
  // Get images for each product based on selected color
  const getProductImages = (itemId: string): string[] => {
    const colorImages = hamperState.colorImages[hamperState.selectedColor] || hamperState.colorImages["royal-blue"]
    // Map item IDs to image indices in the colorImages array
    const imageMap: Record<string, number> = {
      mattress: 0,
      topper: 1,
      lounger: 2,
      "head-pillow": 3,
      "pillow-bumpers": 4,
    }
    // Get the main image for this product
    const mainImageIndex = imageMap[itemId] || 0
    const mainImage = colorImages[mainImageIndex] || babyProducts.find(p => p.id === itemId)?.image || ""
    
    // Return array with the main product image (can be expanded with more images later)
    return [mainImage, ...colorImages.filter((_, idx) => idx !== mainImageIndex).slice(0, 4)]
  }
  
  const setImageIndex = (itemId: string, index: number) => {
    setSelectedImageIndices(prev => ({ ...prev, [itemId]: index }))
  }

  const closeImageViewer = () => {
    setActiveViewerItemId(null)
  }
  
  const handleAddToCart = async () => {
    const getFabricLabel = (fabricValue: string) =>
      fabricOptions.find((option) => option.value === fabricValue)?.label || fabricValue

    const selectedFabrics = [
      hamperState.mattressFabric,
      hamperState.topperFabric,
      hamperState.loungerFabric,
      hamperState.pillowFabric,
      hamperState.bumperFabric,
    ]
      .filter((fabric): fabric is string => Boolean(fabric))
      .map(getFabricLabel)

    const uniqueFabrics = Array.from(new Set(selectedFabrics))
    const fabricSummary = uniqueFabrics.length > 0 ? uniqueFabrics.join(", ") : "Standard"

    const includedItems = babyProducts
      .filter((productData) => hamperState.hamperItems.includes(productData.id))
      .map((productData) => productData.name)

    const selectedColorLabel =
      hamperState.colorOptions.find((option) => option.name === hamperState.selectedColor)?.label ||
      hamperState.selectedColor

    const bedSpreadLabel = hamperState.bedSpreadColor
      ? hamperState.bedSpreadColor.charAt(0).toUpperCase() + hamperState.bedSpreadColor.slice(1)
      : ""

    const summaryParts = []
    if (includedItems.length > 0) {
      summaryParts.push(`Includes: ${includedItems.join(", ")}`)
    }
    if (selectedColorLabel) {
      summaryParts.push(`Color: ${selectedColorLabel}`)
    }
    if (bedSpreadLabel) {
      summaryParts.push(`Bed Sheet: ${bedSpreadLabel}`)
    }

    const sizeInfo = summaryParts.join(" | ") || "Standard"
    const hamperImage = hamperState.currentImages[0] || product.images[0] || "/productmattress.jpg"

    const items: CartItem[] = [
      {
        id: `joy-baby-hamper-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: product.name,
        image: hamperImage,
        size: sizeInfo,
        fabric: fabricSummary,
        quantity: 1,
        price: totalPrice,
      },
    ]
    
    onAddToCart(items)
  }
  
  // Helper function to handle standard size selection
  const handleStandardSizeChange = (itemId: string, sizeValue: string) => {
    const size = standardSizes[itemId as keyof typeof standardSizes]?.find(s => s.value === sizeValue)
    if (size) {
      if (itemId === "mattress") {
        hamperState.setStandardLength(size.dimensions.length)
        hamperState.setStandardBreadth(size.dimensions.breadth)
        hamperState.setStandardHeight(size.dimensions.height)
      } else if (itemId === "topper") {
        hamperState.setStandardTopperLength(size.dimensions.length)
        hamperState.setStandardTopperBreadth(size.dimensions.breadth)
        hamperState.setStandardTopperHeight(size.dimensions.height)
      } else if (itemId === "lounger") {
        hamperState.setStandardLoungerLength(size.dimensions.length)
        hamperState.setStandardLoungerBreadth(size.dimensions.breadth)
        hamperState.setStandardLoungerHeight(size.dimensions.height)
      } else if (itemId === "head-pillow") {
        hamperState.setStandardPillowLength(size.dimensions.length)
        hamperState.setStandardPillowBreadth(size.dimensions.breadth)
        hamperState.setStandardPillowHeight(size.dimensions.height)
      } else if (itemId === "pillow-bumpers") {
        hamperState.setStandardBumperLength(size.dimensions.length)
        hamperState.setStandardBumperBreadth(size.dimensions.breadth)
        hamperState.setStandardBumperHeight(size.dimensions.height)
      }
    }
  }
  
  // Helper function to get current standard size value
  const getCurrentStandardSize = (itemId: string): string => {
    if (itemId === "mattress") {
      const sizes = standardSizes.mattress
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardLength &&
        s.dimensions.breadth === hamperState.standardBreadth &&
        s.dimensions.height === hamperState.standardHeight
      )?.value || ""
    } else if (itemId === "topper") {
      const sizes = standardSizes.topper
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardTopperLength &&
        s.dimensions.breadth === hamperState.standardTopperBreadth &&
        s.dimensions.height === hamperState.standardTopperHeight
      )?.value || ""
    } else if (itemId === "lounger") {
      const sizes = standardSizes.lounger
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardLoungerLength &&
        s.dimensions.breadth === hamperState.standardLoungerBreadth &&
        s.dimensions.height === hamperState.standardLoungerHeight
      )?.value || ""
    } else if (itemId === "head-pillow") {
      const sizes = standardSizes["head-pillow"]
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardPillowLength &&
        s.dimensions.breadth === hamperState.standardPillowBreadth &&
        s.dimensions.height === hamperState.standardPillowHeight
      )?.value || ""
    } else if (itemId === "pillow-bumpers") {
      const sizes = standardSizes["pillow-bumpers"]
      return sizes.find(s => 
        s.dimensions.length === hamperState.standardBumperLength &&
        s.dimensions.breadth === hamperState.standardBumperBreadth &&
        s.dimensions.height === hamperState.standardBumperHeight
      )?.value || ""
    }
    return ""
  }
  
  // Calculate total price based on selected items, dimensions, and fabrics
  const totalPrice = hamperState.hamperItems.reduce((sum, itemId) => {
    const productData = babyProducts.find(p => p.id === itemId)
    if (!productData) return sum
    
    let basePrice = productData.price
    
    // Get dimension multiplier
    let dimensionMultiplier = 1.0
    const currentSizeValue = getCurrentStandardSize(itemId)
    if (currentSizeValue) {
      const size = standardSizes[itemId as keyof typeof standardSizes]?.find(s => s.value === currentSizeValue)
      if (size && size.priceMultiplier) {
        dimensionMultiplier = size.priceMultiplier
      }
    }
    
    // Get fabric multiplier
    let fabricMultiplier = 1.0
    if (itemId === "mattress" && hamperState.mattressFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.mattressFabric] || 1.0
    } else if (itemId === "topper" && hamperState.topperFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.topperFabric] || 1.0
    } else if (itemId === "lounger" && hamperState.loungerFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.loungerFabric] || 1.0
    } else if (itemId === "head-pillow" && hamperState.pillowFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.pillowFabric] || 1.0
    } else if (itemId === "pillow-bumpers" && hamperState.bumperFabric) {
      fabricMultiplier = fabricMultipliers[hamperState.bumperFabric] || 1.0
    }
    
    // Calculate final price: base price * dimension multiplier * fabric multiplier
    const finalPrice = Math.round(basePrice * dimensionMultiplier * fabricMultiplier)
    
    return sum + finalPrice
  }, 0)

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Content - All Items Customization */}
      <div className="lg:col-span-9 space-y-8">
        {/* Mattress Customization */}
        {hamperState.hamperItems.includes("mattress") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Mattress</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                {/* Main Image */}
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
              
              {/* Right Side - Standard Dimensions */}
              <div>
                <h4 className="text-2xl font-medium text-foreground mb-4">Standard Dimensions</h4>
                <div className="space-y-4">
                  {/* Standard Size Dropdown */}
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Dimensions(in inches)</label>
                    <div className="w-full rounded-md border border-[#EED9C4] px-3 py-2 text-foreground">
                      {standardSizes.mattress[0]?.label}
                    </div>
                    
                   
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Topper Customization */}
        {hamperState.hamperItems.includes("topper") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Topper</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="cursor-pointer" onClick={() => setActiveViewerItemId("topper")}>
                  <MagnifyImage
                    src={getProductImages("topper")[selectedImageIndices.topper] || "/topper.jpg"}
                    alt="JOY Topper"
                    enableHoverZoom={false}
                    enableMobileTapZoom={false}
                    showMobileHint={false}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {getProductImages("topper").length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {getProductImages("topper").map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex("topper", index)}
                        type="button"
                        className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                          selectedImageIndices.topper === index
                            ? "border-[#EED9C4] opacity-100"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Topper view ${index + 1}`}
                          fill
                          className="object-cover pointer-events-none"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right Side - Standard Dimensions */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">Standard Dimensions</h4>
                <div className="space-y-4">
                  {/* Standard Size Dropdown */}
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Dimensions(in inches)</label>
                    <div className="w-full rounded-md border border-[#EED9C4] px-3 py-2 text-foreground">
                      {standardSizes.topper[0]?.label}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lounger Customization */}
        {hamperState.hamperItems.includes("lounger") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Lounger</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="cursor-pointer" onClick={() => setActiveViewerItemId("lounger")}>
                  <MagnifyImage
                    src={getProductImages("lounger")[selectedImageIndices.lounger] || "/lounger.jpg"}
                    alt="JOY Lounger"
                    enableHoverZoom={false}
                    enableMobileTapZoom={false}
                    showMobileHint={false}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {getProductImages("lounger").length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {getProductImages("lounger").map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex("lounger", index)}
                        type="button"
                        className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                          selectedImageIndices.lounger === index
                            ? "border-[#EED9C4] opacity-100"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Lounger view ${index + 1}`}
                          fill
                          className="object-cover pointer-events-none"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right Side - Standard Dimensions */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">Standard Dimensions</h4>
                <div className="space-y-4">
                  {/* Standard Size Dropdown */}
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Dimensions(in inches)</label>
                    <div className="w-full rounded-md border border-[#EED9C4] px-3 py-2 text-foreground">
                      {standardSizes.lounger[0]?.label}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Head Pillow Customization */}
        {hamperState.hamperItems.includes("head-pillow") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Head Pillow</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="cursor-pointer" onClick={() => setActiveViewerItemId("head-pillow")}>
                  <MagnifyImage
                    src={getProductImages("head-pillow")[selectedImageIndices["head-pillow"]] || "/pillow.jpg"}
                    alt="JOY Head Pillow"
                    enableHoverZoom={false}
                    enableMobileTapZoom={false}
                    showMobileHint={false}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {getProductImages("head-pillow").length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {getProductImages("head-pillow").map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex("head-pillow", index)}
                        type="button"
                        className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                          selectedImageIndices["head-pillow"] === index
                            ? "border-[#EED9C4] opacity-100"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Head Pillow view ${index + 1}`}
                          fill
                          className="object-cover pointer-events-none"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right Side - Standard Dimensions */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">Standard Dimensions</h4>
                <div className="space-y-4">
                  {/* Standard Size Dropdown */}
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Dimensions(in inches)</label>
                    <div className="w-full rounded-md border border-[#EED9C4] px-3 py-2 text-foreground">
                      {standardSizes["head-pillow"][0]?.label}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pillow Bumpers Customization */}
        {hamperState.hamperItems.includes("pillow-bumpers") && (
          <div className="p-6 bg-white border-2 border-[#EED9C4]">
            <h3 className="text-xl font-medium text-foreground mb-6">Pillow Bumpers</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="cursor-pointer" onClick={() => setActiveViewerItemId("pillow-bumpers")}>
                  <MagnifyImage
                    src={getProductImages("pillow-bumpers")[selectedImageIndices["pillow-bumpers"]] || "/bumpers.jpg"}
                    alt="JOY Pillow Bumpers"
                    enableHoverZoom={false}
                    enableMobileTapZoom={false}
                    showMobileHint={false}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {getProductImages("pillow-bumpers").length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {getProductImages("pillow-bumpers").map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex("pillow-bumpers", index)}
                        type="button"
                        className={`relative aspect-square overflow-hidden border-2 transition-all cursor-pointer hover:opacity-80 ${
                          selectedImageIndices["pillow-bumpers"] === index
                            ? "border-[#EED9C4] opacity-100"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Pillow Bumpers view ${index + 1}`}
                          fill
                          className="object-cover pointer-events-none"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right Side - Standard Dimensions */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">Standard Dimensions</h4>
                <div className="space-y-4">
                  {/* Standard Size Dropdown */}
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Dimensions(in inches)</label>
                    <div className="w-full rounded-md border border-[#EED9C4] px-3 py-2 text-foreground">
                      {standardSizes["pillow-bumpers"][0]?.label}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Hamper Includes */}
      <div className="lg:col-span-3">
        <div className="sticky top-24 p-7 bg-white border-2 border-[#EED9C4]">
          <h3 className="text-xl font-semibold text-foreground mb-4">Hamper Includes:</h3>
          <div className="space-y-3">
            {babyProducts.map((product) => (
              <label key={product.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hamperState.hamperItems.includes(product.id)}
                  onChange={() => hamperState.toggleHamperItem(product.id)}
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
              value={
                hamperState.mattressFabric ||
                hamperState.topperFabric ||
                hamperState.loungerFabric ||
                hamperState.pillowFabric ||
                hamperState.bumperFabric ||
                ""
              }
              onValueChange={(value) => {
                hamperState.setMattressFabric(value)
                hamperState.setTopperFabric(value)
                hamperState.setLoungerFabric(value)
                hamperState.setPillowFabric(value)
                hamperState.setBumperFabric(value)
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
            disabled={isAddingToCart || hamperState.hamperItems.length === 0}
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
        productName={babyProducts.find((item) => item.id === activeViewerItemId)?.name || product.name}
        isOpen={Boolean(activeViewerItemId)}
        onClose={closeImageViewer}
      />
    )}
    </>
  )
}
