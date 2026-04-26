"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type CartItem } from "@/components/cart/cart-drawer"
import type { ProductDetail } from "@/data/product-details"
import { fabricOptions } from "@/data/fabric"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { ProductImageViewerModal } from "@/components/product/product-image-viewer-modal"
import ComplementaryProductsModal from "@/components/product/complementary-products-modal"

interface ApiFabric {
  id: string
  name: string
  image?: string
}

interface ApiProductVariant {
  weight: number
  length: number
  width: number
  height: number
  fabric: string
  price: number
  stock: number
  imageUrls?: string[]
}

interface ProductConfiguratorProps {
  productId?: string
  product: ProductDetail
  variants?: ApiProductVariant[]
  onAddToCart: (item: CartItem) => void
  isAddingToCart: boolean
  showColorConfigurator?: boolean
}

export function ProductConfigurator({
  productId,
  product,
  variants = [],
  onAddToCart,
  isAddingToCart,
  showColorConfigurator = true,
}: ProductConfiguratorProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [useCustomDimensions, setUseCustomDimensions] = useState(false)
  const [customLength, setCustomLength] = useState("")
  const [customWidth, setCustomWidth] = useState("")
  const [customHeight, setCustomHeight] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedFabric, setSelectedFabric] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showComplementaryModal, setShowComplementaryModal] = useState(false)
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null)
  const [isLoadingComplementary, setIsLoadingComplementary] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [dynamicFabrics, setDynamicFabrics] = useState<ApiFabric[]>([])
  const [variantImageCache, setVariantImageCache] = useState<Record<string, string[]>>({})
  const [lazyVariantImages, setLazyVariantImages] = useState<string[] | null>(null)



  const productImages = product.images?.length ? product.images : ["/placeholder.svg"]
  const customSizeLabel = `${customLength || "-"}x${customWidth || "-"}x${customHeight || "-"} cm`
  const hasCustomDimensions = Boolean(customLength && customWidth && customHeight)
  const minVariantPrice = useMemo(() => {
    if (!variants.length) return undefined
    return variants.reduce((min, variant) => Math.min(min, variant.price), variants[0].price)
  }, [variants])

  const parsedSelectedSize = useMemo(() => {
    if (!selectedSize || useCustomDimensions) return null
    const sizeMatch = selectedSize.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:\s*cm)?/i)
    if (!sizeMatch) return null
    return {
      length: Number(sizeMatch[1]),
      width: Number(sizeMatch[2]),
      height: Number(sizeMatch[3]),
    }
  }, [selectedSize, useCustomDimensions])

  // Find all variants that match the selected size
  const matchingVariants = useMemo(() => {
    if (!parsedSelectedSize || !variants.length) return []

    return variants.filter(
      (v) =>
        v.length === parsedSelectedSize.length &&
        v.width === parsedSelectedSize.width &&
        v.height === parsedSelectedSize.height
    )
  }, [parsedSelectedSize, variants])

  // Get unique fabrics from matching variants (for the selected size)
  const availableFabrics = useMemo(() => {
    if (useCustomDimensions || !selectedSize) {
      // For custom dimensions or no size selected, show all fabrics
      if (!variants.length) return []
      return Array.from(new Set(variants.map((v) => v.fabric).filter(Boolean)))
    }
    
    // For selected size, show fabrics available for that size
    if (matchingVariants.length === 0) return []
    return Array.from(new Set(matchingVariants.map((v) => v.fabric).filter(Boolean)))
  }, [matchingVariants, variants, selectedSize, useCustomDimensions])

  // Find the variant that matches selected size and fabric first
  const selectedVariant = useMemo(() => {
    if (!parsedSelectedSize || !variants.length) return null

    // If fabric is selected, find variant matching both size and fabric
    if (selectedFabric) {
      return matchingVariants.find((v) => v.fabric === selectedFabric) || null
    }
    
    // Otherwise, return the first matching variant
    return matchingVariants[0] || null
  }, [parsedSelectedSize, selectedFabric, matchingVariants])

  // Fallback: if exact size+fabric variant is not available, use any variant for selected fabric.
  const fallbackVariantByFabric = useMemo(() => {
    if (!selectedFabric || !variants.length) return null
    return variants.find((v) => v.fabric === selectedFabric) || null
  }, [selectedFabric, variants])

  const variantImageKey = useMemo(() => {
    if (!selectedFabric) return ""
    const sizeKey = parsedSelectedSize
      ? `${parsedSelectedSize.length}x${parsedSelectedSize.width}x${parsedSelectedSize.height}`
      : "any-size"
    return `${selectedFabric}::${sizeKey}`
  }, [selectedFabric, parsedSelectedSize])

  const activeImages = useMemo(() => {
    if (lazyVariantImages && lazyVariantImages.length > 0) {
      return lazyVariantImages
    }
    if (selectedVariant?.imageUrls && selectedVariant.imageUrls.length > 0) {
      return selectedVariant.imageUrls
    }
    if (fallbackVariantByFabric?.imageUrls && fallbackVariantByFabric.imageUrls.length > 0) {
      return fallbackVariantByFabric.imageUrls
    }
    return productImages
  }, [selectedVariant, fallbackVariantByFabric, productImages, lazyVariantImages])

  const price = selectedVariant?.price ?? minVariantPrice ?? 0
  const totalPrice = price * quantity
  const hasSufficientStock =
    !parsedSelectedSize || (selectedVariant && selectedVariant.stock >= quantity)
  const canAddToCart =
    (useCustomDimensions ? hasCustomDimensions : Boolean(selectedSize)) &&
    (availableFabrics.length <= 1 || Boolean(selectedFabric)) &&
    hasSufficientStock

  // Fetch dynamic fabrics from database
  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        const response = await fetch("/api/fabrics")
        const data = await response.json()
        if (data.success && Array.isArray(data.fabrics)) {
          setDynamicFabrics(data.fabrics)
        }
      } catch (error) {
        console.error("[v0] Error fetching fabrics:", error)
      }
    }
    fetchFabrics()
  }, [])

  useEffect(() => {
    if (!useCustomDimensions && !selectedSize && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].name.split(" - ")[0])
    }
  }, [product.sizes, selectedSize, useCustomDimensions])

  useEffect(() => {
    if (availableFabrics.length > 0 && !selectedFabric) {
      setSelectedFabric(availableFabrics[0])
    }
  }, [availableFabrics, selectedFabric])

  // Update selected fabric when variant changes (auto-select if only one fabric)
  useEffect(() => {
    if (matchingVariants.length > 0) {
      const uniqueFabrics = Array.from(new Set(matchingVariants.map((v) => v.fabric).filter(Boolean)))
      
      // If current fabric is not available for this size, reset it
      if (selectedFabric && !uniqueFabrics.includes(selectedFabric)) {
        setSelectedFabric("")
      }
      
      // Auto-select if only one fabric available
      if (!selectedFabric && uniqueFabrics.length === 1) {
        setSelectedFabric(uniqueFabrics[0])
      }
    } else if (!useCustomDimensions && selectedFabric) {
      // Reset fabric if no matching variants
      setSelectedFabric("")
    }
  }, [matchingVariants, selectedFabric, useCustomDimensions])

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [activeImages, setSelectedImageIndex])

  useEffect(() => {
    if (!productId || !selectedFabric || !variantImageKey) {
      setLazyVariantImages(null)
      return
    }

    const cachedImages = variantImageCache[variantImageKey]
    if (cachedImages && cachedImages.length > 0) {
      setLazyVariantImages(cachedImages)
      return
    }

    let isMounted = true
    const params = new URLSearchParams()
    params.set("fabric", selectedFabric)
    if (parsedSelectedSize) {
      params.set("length", String(parsedSelectedSize.length))
      params.set("width", String(parsedSelectedSize.width))
      params.set("height", String(parsedSelectedSize.height))
    }

    const fetchVariantImages = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/variant-images?${params.toString()}`)
        const data = await response.json()
        if (!isMounted || !response.ok || !data?.success) return
        const fetchedImages = Array.isArray(data.imageUrls)
          ? data.imageUrls.filter((url: unknown) => typeof url === "string" && !!url.trim())
          : []
        if (fetchedImages.length === 0) return
        setVariantImageCache((prev) => ({ ...prev, [variantImageKey]: fetchedImages }))
        setLazyVariantImages(fetchedImages)
      } catch (error) {
        console.error("[v0] Error fetching variant images:", error)
      }
    }

    fetchVariantImages()

    return () => {
      isMounted = false
    }
  }, [productId, selectedFabric, parsedSelectedSize, variantImageKey, variantImageCache])

  const handleAddToCart = async () => {
    if (!canAddToCart) return

    const finalSize = useCustomDimensions ? customSizeLabel : selectedSize
    const item: CartItem = {
      id: `${product.id}-${finalSize}-${Date.now()}`,
      name: product.name,
      image: productImages[0],
      size: finalSize,
      fabric: selectedFabric || selectedVariant?.fabric || undefined,
      quantity,
      price,
    }
    
    // Check if product has complementary items available
    try {
      setIsLoadingComplementary(true)
      const response = await fetch(`/api/products/${product.id}/complementary`)
      const data = await response.json()
      
      // Only show modal if there are complementary products available
      if (data.success && data.complementaryProducts && data.complementaryProducts.length > 0) {
        // Has complementary products - show modal for selection
        setPendingCartItem(item)
        setShowComplementaryModal(true)
      } else {
        // No complementary products - add directly to cart without modal
        onAddToCart(item)
      }
    } catch (error) {
      console.error("[v0] Error checking complementary products:", error)
      // On error, add directly to cart without waiting
      onAddToCart(item)
    } finally {
      setIsLoadingComplementary(false)
    }
  }

  const handleComplementaryProductsConfirm = async (selectedComplementaryIds: string[]) => {
    if (!pendingCartItem) return

    let complementaryItems: any[] = []

    // Fetch the complementary products details if any are selected
    if (selectedComplementaryIds.length > 0) {
      try {
        // Fetch details for each complementary product
        const productPromises = selectedComplementaryIds.map((id) =>
          fetch(`/api/products/${id}`).then((res) => res.json())
        )
        const productResponses = await Promise.all(productPromises)

        complementaryItems = productResponses
          .filter((res) => res.success && res.product)
          .map((res) => ({
            id: res.product._id,
            name: res.product.productTitle,
            image: res.product.primaryImage || res.product.imageUrls?.[0] || null,
          }))
      } catch (error) {
        console.error("[v0] Error fetching complementary product details:", error)
        // Still add to cart even if we couldn't fetch all details
        complementaryItems = selectedComplementaryIds.map((id) => ({
          id,
          name: undefined,
          image: undefined,
        }))
      }
    }

    // Add the item to cart with complementary items
    const itemToAdd: CartItem = {
      ...pendingCartItem,
      complementaryItems: complementaryItems.length > 0 ? complementaryItems : undefined,
    }
    
    onAddToCart(itemToAdd)

    // Close modal and reset
    setShowComplementaryModal(false)
    setPendingCartItem(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="p-6 bg-white border-2 border-[#EED9C4]">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="cursor-pointer" onClick={() => setIsImageViewerOpen(true)}>
                <MagnifyImage
                  src={activeImages[selectedImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  className="rounded-lg bg-gray-50"
                  enableHoverZoom={false}
                  enableMobileTapZoom={false}
                  showMobileHint={false}
                />
              </div>

              {activeImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2 max-w-[320px] sm:max-w-[360px]">
                  {activeImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
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
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-3xl font-medium text-foreground mb-3">{product.name}</h3>
              <h4 className="text-2xl font-medium text-foreground mb-4">Dimensions </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomDimensions(false)
                      setSelectedSize("")
                    }}
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
                    onClick={() => {
                      setUseCustomDimensions(true)
                      setSelectedSize(customSizeLabel)
                    }}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      useCustomDimensions
                        ? "bg-[#EED9C4] text-foreground"
                        : "bg-gray-200 text-foreground/70 hover:bg-gray-300"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                <div>
                  {!useCustomDimensions ? (
                    <>
                      <label className="text-base font-medium text-foreground mb-2 block">Select Size</label>
                      <Select value={selectedSize || undefined} onValueChange={setSelectedSize}>
                    <SelectTrigger className="w-full text-foreground data-placeholder:text-foreground">
                          <SelectValue placeholder="Select dimensions" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.sizes.map((size) => (
                            <SelectItem key={size.name} value={size.name.split(" - ")[0]}>
                              {size.name.split(" - ")[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <label className="text-base font-medium text-foreground mb-2 block">Custom Dimensions (cm)</label>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          type="number"
                          min="1"
                          value={customLength}
                          onChange={(event) => {
                            setCustomLength(event.target.value)
                            setSelectedSize(`${event.target.value || "-"}x${customWidth || "-"}x${customHeight || "-"} cm`)
                          }}
                          placeholder="Length"
                        />
                        <Input
                          type="number"
                          min="1"
                          value={customWidth}
                          onChange={(event) => {
                            setCustomWidth(event.target.value)
                            setSelectedSize(`${customLength || "-"}x${event.target.value || "-"}x${customHeight || "-"} cm`)
                          }}
                          placeholder="Width"
                        />
                        <Input
                          type="number"
                          min="1"
                          value={customHeight}
                          onChange={(event) => {
                            setCustomHeight(event.target.value)
                            setSelectedSize(`${customLength || "-"}x${customWidth || "-"}x${event.target.value || "-"} cm`)
                          }}
                          placeholder="Height"
                        />
                      </div>
                    </>
                  )}
                </div>

                {availableFabrics.length > 0 && (
                  <div>
                    <label className="text-base font-medium text-foreground mb-2 block">Fabric</label>
                    <Select value={selectedFabric || undefined} onValueChange={setSelectedFabric}>
                      <SelectTrigger className="w-full text-foreground ">
                        <SelectValue placeholder="Select fabric" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFabrics.map((fabricId) => {
                          // First check dynamic fabrics from database
                          const dynamicFabric = dynamicFabrics.find((fabric) => fabric.id === fabricId)
                          // Fallback to static fabrics
                          const fabricOption = dynamicFabric || fabricOptions.find((fabric) => fabric.id === fabricId)
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




                <div>
                  <label className="text-base font-medium text-foreground mb-2 block">Quantity</label>
                  <div className="inline-flex items-center border rounded" style={{ borderColor: "#EED9C4" }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-foreground hover:opacity-70 transition-opacity"
                    >
                      -
                    </button>
                    <span className="px-6 py-2 min-w-[60px] text-center text-foreground">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-foreground hover:opacity-70 transition-opacity"
                    >
                      +
                    </button>
                  </div>
                </div>

                
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="p-6 bg-white border-2 border-[#EED9C4] space-y-6">
          <div>
            <p className="text-lg font-medium text-foreground">Total Price</p>
            <p className="text-2xl font-semibold text-foreground mt-2">
              ₹{totalPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              <span className="text-sm font-normal text-foreground/70"> (inclusive of all taxes)</span>
            </p>
          </div>
          {selectedVariant && !hasSufficientStock && (
            <p className="text-sm text-red-600">
              Only {selectedVariant.stock} left in stock for this selection.
            </p>
          )}
          <Button
            className="w-full bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground py-3 text-base"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !canAddToCart}
          >
            {isAddingToCart ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Complementary Products Modal */}
      {pendingCartItem && (
        <ComplementaryProductsModal
          isOpen={showComplementaryModal}
          productId={String(product.id)}
          mainProductName={product.name}
          onClose={() => {
            setShowComplementaryModal(false)
            setPendingCartItem(null)
          }}
          onConfirm={handleComplementaryProductsConfirm}
          isLoading={isLoadingComplementary}
        />
      )}
      <ProductImageViewerModal
        images={activeImages}
        initialIndex={selectedImageIndex}
        productName={product.name}
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
      />
    </div>
  )
}
