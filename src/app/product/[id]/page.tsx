"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getProductDetailById, type ProductDetail } from "@/data/product-details"
import { type CartItem } from "@/components/cart/cart-drawer"
import { useCart } from "@/contexts/cart-context"
import { getProductType, isBlissProduct, isGraceProduct, isJoyProduct } from "@/utils/product-type"
import { fabricOptions } from "@/data/fabric"
import { BabyHamperProductTemplate } from "@/collections/joy/templates/BabyHamperProductTemplate"
import { KidsHamperProductTemplate } from "@/collections/joy/templates/KidsHamperProductTemplate"
import { IndividualProductTemplate } from "./templates/IndividualProductTemplate"
import { MattressProductTemplate } from "@/collections/joy/templates/MattressProductTemplate"
import { TopperProductTemplate } from "@/collections/joy/templates/TopperProductTemplate"
import { LoungerProductTemplate } from "@/collections/joy/templates/LoungerProductTemplate"
import { HeadPillowProductTemplate } from "@/collections/joy/templates/HeadPillowProductTemplate"
import { PillowBumpersProductTemplate } from "@/collections/joy/templates/PillowBumpersProductTemplate"
import { BlissMattressProductTemplate } from "@/collections/bliss/templates/BlissMattressProductTemplate"
import { BlissTopperProductTemplate } from "@/collections/bliss/templates/BlissTopperProductTemplate"
import { BlissLoungerProductTemplate } from "@/collections/bliss/templates/BlissLoungerProductTemplate"
import { BlissHeadPillowProductTemplate } from "@/collections/bliss/templates/BlissHeadPillowProductTemplate"
import { GraceMattressProductTemplate } from "@/collections/grace/templates/GraceMattressProductTemplate"
import { GraceTopperProductTemplate } from "@/collections/grace/templates/GraceTopperProductTemplate"
import { GraceLoungerProductTemplate } from "@/collections/grace/templates/GraceLoungerProductTemplate"
import { GraceHeadPillowProductTemplate } from "@/collections/grace/templates/GraceHeadPillowProductTemplate"
import { SimpleProductConfigurator } from "@/components/product/simple-product-configurator"
import { ProductConfigurator } from "@/components/product/product-configurator"
import { ProductDetailQuoteLoader } from "@/components/sections/product-detail-quote-loader"
import { CustomerTestimonialVideos } from "@/components/sections/customer-testimonial-videos"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

interface ApiProductDetailSection {
  title: string
  body: string
  imageUrl?: string
  imageAlt?: string
  imagePosition?: "left" | "right"
}

interface ApiHamperItemVariant {
  weight: number
  length: number
  width: number
  height: number
  fabric?: string
  imageUrls?: string[]
  stock: number
}

interface ApiHamperItem {
  name: string
  imageUrls: string[]
  variants: ApiHamperItemVariant[]
}

interface ApiProduct {
  _id: string
  productType?: "single" | "hamper"
  productTitle: string
  description: string
  units: string
  sellerName: string
  sellerEmail: string
  location: string
  category: string
  subCategory?: string
  primaryImage?: string
  imageUrls: string[]
  colorOptions?: Array<{
    fabric: string
    imageUrls: string[]
  }>
  variants: ApiProductVariant[]
  detailSections?: ApiProductDetailSection[]
  hamperItems?: ApiHamperItem[]
  hamperPrice?: number
  hamperFabric?: string
  hamperFabricOptions?: string[]
  status: "visible" | "hidden"
}

const toTitleCase = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)
const getFabricLabel = (fabricId: string) => fabricOptions.find((fabric) => fabric.id === fabricId)?.name || fabricId

const formatVariantSize = (variant: ApiProductVariant) => {
  return `${variant.length}x${variant.width}x${variant.height} cm`
}

const mapApiProductToDetail = (product: ApiProduct): ProductDetail => {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const colorOptions = Array.isArray(product.colorOptions) ? product.colorOptions : []
    const hamperItems = Array.isArray(product.hamperItems) ? product.hamperItems : []
    const dbHamperPrice = typeof product.hamperPrice === "number" && Number.isFinite(product.hamperPrice) ? product.hamperPrice : null
    const minVariantPrice = variants.reduce((currentMin, variant) => Math.min(currentMin, variant.price), Number.POSITIVE_INFINITY)
    const minHamperPrice = hamperItems.length
      ? hamperItems.reduce((sum, item) => {
        // Backward-compat: older hamper items had per-variant price in DB.
        const legacyVariantPrices = (item.variants as any[] | undefined)?.map((variant) => Number(variant?.price)).filter((price) => Number.isFinite(price)) || []
        const itemMin = legacyVariantPrices.length ? Math.min(...legacyVariantPrices) : 0
        return sum + itemMin
      }, 0)
      : 0
  const startingPrice = product.productType === "hamper"
    ? (dbHamperPrice ?? minHamperPrice)
    : Number.isFinite(minVariantPrice)
      ? minVariantPrice
      : 0
  const totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
  const uniqueFabrics = Array.from(new Set(variants.map((variant) => variant.fabric).filter(Boolean)))
  const features = [
    product.sellerName ? `Seller: ${product.sellerName}` : null,
    product.location ? `Location: ${product.location}` : null,
    uniqueFabrics.length ? `Fabrics: ${uniqueFabrics.map(getFabricLabel).join(", ")}` : null,
  ].filter(Boolean) as string[]

  return {
    id: product._id,
    name: product.productTitle,
    category: product.category,
    price: startingPrice,
    rating: 0,
    reviews: 0,
    description: product.description,
    images:
      colorOptions[0]?.imageUrls?.length
        ? colorOptions[0].imageUrls
        : product.primaryImage
      ? [product.primaryImage, ...(product.imageUrls || []).filter((url) => url !== product.primaryImage)]
      : product.imageUrls?.length
        ? product.imageUrls
        : ["/placeholder.svg"],
    firmness: "Standard",
    height: variants[0]?.height ? `${variants[0].height} cm` : "Standard",
    materials: [
      `Category: ${toTitleCase(product.category)}`,
      ...(product.subCategory ? [`Collection: ${toTitleCase(product.subCategory)}`] : []),
    ],
    features,
    specifications: {
      Units: product.units,
      Variants: `${variants.length}`,
      "Total Stock": `${totalStock}`,
    },
    sizes: variants.length
      ? variants.map((variant) => ({
          name: formatVariantSize(variant),
          price: variant.price,
        }))
      : [{ name: "Standard", price: startingPrice }],
  }
}

export default function ProductDetailPage() {
  const MIN_LOADER_MS = 900
  const params = useParams()
  const router = useRouter()
  const rawId = params.id as string
  const isNumericId = /^\d+$/.test(rawId)
  const numericId = isNumericId ? Number(rawId) : null
  const staticProduct = numericId !== null ? getProductDetailById(numericId) : undefined

  const [apiProduct, setApiProduct] = useState<ProductDetail | null>(null)
  const [rawApiProduct, setRawApiProduct] = useState<ApiProduct | null>(null)
  const [isLoading, setIsLoading] = useState(!staticProduct)
  const [showLoader, setShowLoader] = useState(!staticProduct)
  const [contentVisible, setContentVisible] = useState(!!staticProduct)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"features" | "specs">("features")
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addToCart } = useCart()
  const loadStartedAtRef = useRef<number>(Date.now())
  const [selectedHamperVariants, setSelectedHamperVariants] = useState<Record<number, number>>({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [rawId])

  useEffect(() => {
    if (staticProduct) {
      setApiProduct(null)
      setRawApiProduct(null)
      setIsLoading(false)
      setShowLoader(false)
      setContentVisible(true)
      setLoadError(null)
      return
    }

    let isMounted = true

    const fetchProduct = async () => {
      try {
        loadStartedAtRef.current = Date.now()
        setIsLoading(true)
        setShowLoader(true)
        setContentVisible(false)
        setLoadError(null)
        const response = await fetch(`/api/products/${rawId}`)
        const data = await response.json()

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Product not found")
        }

        if (data.product?.status === "hidden") {
          throw new Error("This product is not currently available.")
        }

        if (isMounted) {
          const productData = data.product as ApiProduct
          setRawApiProduct(productData)
          setApiProduct(mapApiProductToDetail(productData))
        }
      } catch (error: any) {
        if (isMounted) {
          setLoadError(error.message || "Product not found")
          setApiProduct(null)
          setRawApiProduct(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProduct()

    return () => {
      isMounted = false
    }
  }, [rawId, staticProduct])

  useEffect(() => {
    if (!rawApiProduct || rawApiProduct.productType !== "hamper") return
    const initialSelections: Record<number, number> = {}
    rawApiProduct.hamperItems?.forEach((item, index) => {
      if (Array.isArray(item.variants) && item.variants.length > 0) {
        initialSelections[index] = 0
      }
    })
    setSelectedHamperVariants(initialSelections)
  }, [rawApiProduct])

  useEffect(() => {
    if (isLoading) {
      return
    }

    const elapsed = Date.now() - loadStartedAtRef.current
    const remaining = Math.max(0, MIN_LOADER_MS - elapsed)

    const timer = window.setTimeout(() => {
      setShowLoader(false)
      window.requestAnimationFrame(() => setContentVisible(true))
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [isLoading, MIN_LOADER_MS])

  const product = staticProduct ?? apiProduct
  const productId = staticProduct ? numericId : null

  if (showLoader) {
    return <ProductDetailQuoteLoader />
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">
              {loadError || "Product Not Found in database"}
            </h1>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 border text-black hover:opacity-70 transition-opacity"
              style={{ borderColor: "#D9CFC7" }}
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const apiProductType = rawApiProduct?.productType === "hamper" ? "hamper" : "simple"
  const inferredTemplateType = (() => {
    if (!rawApiProduct) return null
    if (rawApiProduct.productType !== "hamper") return null
    const title = (rawApiProduct.productTitle || "").toLowerCase()
    // Heuristics for DB-created hampers that should use Joy hamper templates
    if (title.includes("baby hamper")) return "baby-hamper"
    if (title.includes("kids hamper") || title.includes("kid hamper")) return "kids-hamper"
    return null
  })()

  const productType = productId !== null ? getProductType(productId) : inferredTemplateType ?? apiProductType
  const isBabyProduct = product.category === "baby"
  const categorySlug = (rawApiProduct?.subCategory || rawApiProduct?.category || product.category || "").toLowerCase()
  const isJoy = productId !== null ? isJoyProduct(productId) : false
  const isBliss = productId !== null ? isBlissProduct(productId) : false
  const isGrace = productId !== null ? isGraceProduct(productId) : false
  const isJoyCollection = isJoy || categorySlug === "joy"
  const isBlissCollection = isBliss || categorySlug === "bliss"
  const isGraceCollection = isGrace || categorySlug === "grace"
  const shippingInformation =
    (product as ProductDetail).shippingInformation ||
    product.specifications?.["Shipping information"] ||
    ""
  const detailSections =
    rawApiProduct?.detailSections?.filter((section) => section.title || section.body || section.imageUrl) || []
  const hamperItems =
    rawApiProduct?.productType === "hamper"
      ? (rawApiProduct?.hamperItems || []).filter((item) => item?.name || (item?.imageUrls || []).length > 0)
      : []

  const hamperTotal =
    typeof rawApiProduct?.hamperPrice === "number" &&
    Number.isFinite(rawApiProduct.hamperPrice) &&
    rawApiProduct.hamperPrice > 0
      ? rawApiProduct.hamperPrice
      : hamperItems.reduce((sum, item, index) => {
          // Backward-compat: older hamper items had per-variant price in DB.
          const selectedIndex = selectedHamperVariants[index] ?? 0
          const variant: any = (item.variants as any[])?.[selectedIndex]
          const price = Number(variant?.price ?? 0)
          return sum + (Number.isFinite(price) ? price : 0)
        }, 0)

  // Color scheme
  const colors = isBabyProduct
    ? {
        bg50: "#FAF7F3",
        bg100: "#F0E4D3",
        border: "#DCC5B2",
        accent: "#D9A299",
        accentHover: "#C9928A",
        text: "#8B6F5C",
        textDark: "#6B5647",
        textLight: "#A08876",
      }
    : {
        bg50: "#F9F8F6",
        bg100: "#EFE9E3",
        border: "#D9CFC7",
        accent: "#6B563F",
        accentHover: "#B09A7D",
        text: "#6B563F",
        textDark: "#5A4A3A",
        textLight: "#B09A7D",
      }

  // Handle add to cart - delegates to appropriate configurator
  const handleAddToCart = async (items: CartItem | CartItem[]) => {
    setIsAddingToCart(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const itemsArray = Array.isArray(items) ? items : [items]
    itemsArray.forEach(item => addToCart(item))
    
    setIsAddingToCart(false)
  }

  const handleHamperAddToCart = async () => {
    const hamperImage =
      rawApiProduct?.primaryImage ||
      rawApiProduct?.imageUrls?.[0] ||
      hamperItems.find((item) => item.imageUrls?.[0])?.imageUrls?.[0] ||
      "/placeholder.svg"
    const totalPrice = hamperTotal
    await handleAddToCart({
      id: `hamper-${rawApiProduct?._id ?? product.id}`,
      productId: String(rawApiProduct?._id ?? product.id),
      name: product.name,
      image: hamperImage,
      size: "Hamper",
      quantity: 1,
      price: totalPrice,
    })
  }

  return (
    <div className={`min-h-screen bg-white transition-opacity duration-200 ${contentVisible ? "opacity-100" : "opacity-0"}`}>
      <Header />
      <main>
        {/* Breadcrumb */}
        {(isJoyCollection || isGraceCollection) && !isBlissCollection ? (
          <>
            <div className="fixed top-20 left-0 right-0 z-40 bg-white border-b" style={{ borderColor: "#D9CFC7" }}>
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="py-2">
                  <ol className="flex items-center gap-2 text-base">
                    <li>
                      <Link href="/" className="text-foreground hover:text-[#6D4530] transition-colors">
                        Home
                      </Link>
                    </li>
                    <li>
                      <ChevronRight className="w-4 h-4 text-foreground/50" />
                    </li>
                    <li>
                      <Link
                        href={isGraceCollection ? "/category/grace" : "/category/joy"}
                        className="text-foreground hover:text-[#6D4530] transition-colors"
                      >
                        {isGraceCollection ? "Grace" : "Joy"}
                      </Link>
                    </li>
                    <li>
                      <ChevronRight className="w-4 h-4 text-foreground/50" />
                    </li>
                    <li className="text-foreground font-medium">
                      {product.name}
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            <div className="h-[49px]"></div>
          </>
        ) : (
          <div className="py-3 border-b" style={{ backgroundColor: "white", borderColor: colors.border }}>
            <div className="w-full px-4">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-base">
                  <li>
                    <Link href="/" className="text-foreground hover:text-[#6D4530] transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <ChevronRight className="w-4 h-4 text-foreground/50" />
                  </li>
                  <li>
                    {isBlissCollection ? (
                      <Link href="/category/bliss" className="text-foreground hover:text-[#6D4530] transition-colors">
                        Bliss
                      </Link>
                    ) : isGraceCollection ? (
                      <Link href="/category/grace" className="text-foreground hover:text-[#6D4530] transition-colors">
                        Grace
                      </Link>
                    ) : isJoyCollection ? (
                      <Link href="/category/joy" className="text-foreground hover:text-[#6D4530] transition-colors">
                        Joy
                      </Link>
                    ) : (
                      <span className="text-foreground">Products</span>
                    )}
                  </li>
                  <li>
                    <ChevronRight className="w-4 h-4 text-foreground/50" />
                  </li>
                  <li className="text-foreground font-medium">
                    {product.name}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 ${isJoyCollection || isBlissCollection || isGraceCollection ? "pb-12 mt-8" : "py-12"}`}>
          {/* Product Templates - Complete page structure for each product type */}
          {productType === "baby-hamper" && (
            <BabyHamperProductTemplate
              product={product}
              productId={productId ?? undefined}
              dbHamper={
                rawApiProduct?.productType === "hamper" &&
                Array.isArray(rawApiProduct.hamperItems) &&
                typeof rawApiProduct.hamperPrice === "number" &&
                (!!rawApiProduct.hamperFabric || (rawApiProduct.hamperFabricOptions || []).length > 0)
                  ? {
                      hamperItems: (rawApiProduct.hamperItems || []).map((item) => ({
                        name: item.name,
                        imageUrls: item.imageUrls || [],
                        variants: (item.variants || []).map((v) => ({
                          weight: v.weight,
                          length: v.length,
                          width: v.width,
                          height: v.height,
                          fabric: v.fabric,
                          imageUrls: v.imageUrls || [],
                          stock: v.stock,
                        })),
                      })),
                      hamperPrice: rawApiProduct.hamperPrice,
                      hamperFabric: rawApiProduct.hamperFabric,
                      hamperFabricOptions: rawApiProduct.hamperFabricOptions || [],
                    }
                  : undefined
              }
              shippingInformation={shippingInformation}
              detailSections={detailSections}
              onAddToCart={handleAddToCart}
              isAddingToCart={isAddingToCart}
            />
          )}
          
          {productType === "kids-hamper" && (
            <KidsHamperProductTemplate
              product={product}
              productId={productId ?? undefined}
              onAddToCart={handleAddToCart}
              isAddingToCart={isAddingToCart}
            />
          )}
          
          {productType === "individual-baby" && (
            <IndividualProductTemplate
              product={product}
              productId={productId!}
              onAddToCart={handleAddToCart}
              isAddingToCart={isAddingToCart}
            />
          )}
          
          {productType === "mattress" && (
            isBlissCollection ? (
              <BlissMattressProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : isGraceCollection ? (
              <GraceMattressProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : (
              <MattressProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            )
          )}
          
          {productType === "topper" && (
            isBlissCollection ? (
              <BlissTopperProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : isGraceCollection ? (
              <GraceTopperProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : (
              <TopperProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            )
          )}
          
          {productType === "lounger" && (
            isBlissCollection ? (
              <BlissLoungerProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : isGraceCollection ? (
              <GraceLoungerProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : (
              <LoungerProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            )
          )}
          
          {productType === "head-pillow" && (
            isBlissCollection ? (
              <BlissHeadPillowProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : isGraceCollection ? (
              <GraceHeadPillowProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            ) : (
              <HeadPillowProductTemplate
                product={product}
                productId={productId!}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />
            )
          )}
          
          {productType === "pillow-bumpers" && (
            <PillowBumpersProductTemplate
              product={product}
              productId={productId!}
              onAddToCart={handleAddToCart}
              isAddingToCart={isAddingToCart}
            />
          )}
          
          {productType === "simple" && (
            <>
              {productId === null ? (
                <>
                  {rawApiProduct?.productType === "hamper" ? (
                    <section className="w-full bg-white py-12">
                      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                          <div>
                            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Hamper Items</h2>
                            <p className="text-sm text-foreground/70 mt-2">
                              Select a variant for each item to calculate the hamper price.
                            </p>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-xs uppercase tracking-wide text-foreground/60">Total price</p>
                            <p className="text-2xl font-semibold text-foreground">
                              ₹{hamperTotal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {hamperItems.map((item, index) => {
                            const selectedIndex = selectedHamperVariants[index] ?? 0
                            return (
                              <div
                                key={`${item.name}-${index}`}
                                className="border border-[#EED9C4] rounded-lg p-4 sm:p-6 bg-[#F9F8F6] space-y-4"
                              >
                                <div className="flex gap-4">
                                  <img
                                    src={item.imageUrls?.[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-28 h-28 object-cover rounded-md border border-[#EED9C4]"
                                  />
                                  <div className="flex-1">
                                    <p className="text-lg font-semibold text-foreground">{item.name}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Choose Variant</label>
                                  <select
                                    className="w-full border border-[#D9CFC7] rounded-md px-3 py-2 bg-white text-sm"
                                    value={selectedIndex}
                                    onChange={(event) =>
                                      setSelectedHamperVariants((prev) => ({
                                        ...prev,
                                        [index]: Number(event.target.value),
                                      }))
                                    }
                                  >
                            {(item.variants || []).map((variant: any, variantIndex) => {
                                      const hasLegacyPricing =
                                        typeof variant?.price === "number" && Number.isFinite(variant.price) && variant.price > 0
                                      const hasLegacyFabric = typeof variant?.fabric === "string" && !!variant.fabric.trim()
                                      const labelParts = [
                                        `${variant.length}x${variant.width}x${variant.height} cm`,
                                        `${variant.weight}kg`,
                                        hasLegacyFabric ? getFabricLabel(variant.fabric) : null,
                                      ].filter(Boolean)
                                      const label = labelParts.join(" · ")
                                      const suffix = hasLegacyPricing ? ` • ₹${variant.price.toLocaleString("en-IN")}` : ""
                                      return (
                                        <option key={`${label}-${variantIndex}`} value={variantIndex}>
                                          {label}
                                          {suffix}
                                        </option>
                                      )
                                    })}
                                  </select>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#EED9C4] pt-6">
                          <div className="text-sm text-foreground/70">
                            Make sure you select a variant for each item.
                          </div>
                          <Button
                            onClick={handleHamperAddToCart}
                            disabled={isAddingToCart}
                            className="bg-[#6D4530] hover:bg-[#8B5A3C] text-white"
                          >
                            {isAddingToCart ? "Adding..." : "Add Hamper to Cart"}
                          </Button>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <ProductConfigurator
                      productId={rawApiProduct?._id}
                      product={product}
                      variants={rawApiProduct?.variants || []}
                      onAddToCart={handleAddToCart}
                      isAddingToCart={isAddingToCart}
                    />
                  )}
                  <section className="w-full bg-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <Accordion type="single" collapsible className="w-full space-y-4">
                        <AccordionItem value="description" className="border border-[#F3E7DA] px-4 rounded-lg shadow-sm">
                          <AccordionTrigger className="text-lg font-medium text-foreground hover:no-underline">
                            Description
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground/80 leading-relaxed">
                            {product.description}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="shipping" className="border border-[#F3E7DA] px-4 last:border-b-2! rounded-lg shadow-sm">
                          <AccordionTrigger className="text-lg font-medium text-foreground hover:no-underline">
                            Shipping information
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground/80 leading-relaxed">
                            {shippingInformation || "Shipping information will be shared after order confirmation."}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </section>
                  {detailSections.length > 0 && (
                    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-stone-50 py-12">
                      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                        <h2 className="text-center text-3xl sm:text-4xl font-medium text-foreground">
                          Product Traits
                        </h2>
                        <div className="space-y-12 lg:space-y-28">
                        {detailSections.map((section, index) => {
                          const isImageLeft =
                            section.imagePosition ? section.imagePosition === "left" : index % 2 === 1
                          const image = section.imageUrl || "/placeholder.svg"
                          const isPlaceholder = image === "/placeholder.svg"
                          return (
                            <div
                              key={`${section.title}-${index}`}
                              className={`grid gap-y-8 lg:gap-y-32 gap-x-8 lg:gap-x-32 items-center ${
                                isImageLeft ? "lg:grid-cols-[1.1fr_0.9fr]" : "lg:grid-cols-[0.9fr_1.1fr]"
                              }`}
                              
                            >
                              <div
                                className={`order-2 ${
                                  isImageLeft ? "lg:order-1" : "lg:order-2"
                                }`}
                              >
                                <div className="w-full aspect-[3/2] overflow-hidden">
                                <img
                                  src={image}
                                  alt={section.imageAlt || section.title || "Product detail"}
                                  className={`w-full h-full border border-[#EED9C4] ${
                                    isPlaceholder ? "object-contain bg-white" : "object-cover"
                                  }`}
                                />
                                </div>
                              </div>
                              <div
                                className={`order-1 ${
                                  isImageLeft ? "lg:order-2" : "lg:order-1"
                                }`}
                              >
                                {section.title && (
                                  <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                                    {section.title}
                                  </h3>
                                )}
                                {section.body && (
                                  <div className="space-y-20 text-base sm:text-lg text-foreground leading-relaxed max-w-none">
                                    {section.body
                                      .split(/\n\s*\n/)
                                      .map((paragraph, paragraphIndex) => (
                                        <p key={paragraphIndex}>{paragraph}</p>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        </div>
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <SimpleProductConfigurator
                  product={product}
                  onAddToCart={handleAddToCart}
                  isAddingToCart={isAddingToCart}
                  colors={colors}
                />
              )}

            </>
          )}
          <CustomerTestimonialVideos />
        </div>
      </main>
      <Footer />
      
    </div>
  )
}
