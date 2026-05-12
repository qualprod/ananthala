"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  IndianRupee,
} from "lucide-react"
import { products, type Product } from "@/data/products"
import { getProductDetailById } from "@/data/product-details"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useCart } from "@/contexts/cart-context"
import { type CartItem } from "@/components/cart/cart-drawer"

interface ProductListingContentProps {
  category?: string
}

export function ProductListingContent({ category }: ProductListingContentProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Get featured product for hero and materials section (first mattress product)
  const featuredProduct = products.find(p => p.category === "mattress") || products[0]
  const featuredProductDetail = featuredProduct ? getProductDetailById(featuredProduct.id) : null
  
  // Initialize selected size for featured product
  useEffect(() => {
    if (featuredProductDetail && !selectedSize) {
      setSelectedSize(featuredProductDetail.sizes[0].name)
    }
  }, [featuredProductDetail, selectedSize])

  const handleBuyNow = async () => {
    if (!featuredProductDetail) return
    
    setIsAddingToCart(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const selectedSizeData = featuredProductDetail.sizes.find((s) => s.name === selectedSize)
    const currentPrice = selectedSizeData?.price || featuredProductDetail.price
    
    const cartItem: CartItem = {
      id: `${featuredProductDetail.id}-${selectedSize}`,
      productId: featuredProductDetail.id?.toString(),
      name: featuredProductDetail.name,
      image: featuredProductDetail.images[0],
      slug: featuredProductDetail.slug || featuredProductDetail.id?.toString(),
      size: selectedSize,
      quantity: 1,
      price: currentPrice,
    }
    
    addToCart(cartItem)
    setIsAddingToCart(false)
  }

  // Handle buy now for products carousel - redirect to product detail page
  const handleProductBuyNow = (productId: number) => {
    router.push(`/product/${productId}`)
  }

  // Handle buy now for baby mattresses carousel - redirect to product detail page
  const handleBabyBuyNow = (productId: number) => {
    router.push(`/product/${productId}`)
  }

  // Get filtered products for carousel (excluding baby products)
  const filteredProducts = products.filter(product => 
    product.category !== "baby"
  )

  // Get baby products
  const babyProducts = products.filter(product => product.category === "baby")

  const colors = {
    bg50: "#F9F8F6",
    bg100: "#EED9C4",
    border: "#EED9C4",
    accent: "#EED9C4",
  }

  return (
    <main>
      {/* Section 1: Hero Image */}
      {featuredProduct && (
        <section className="w-full flex justify-center py-8">
          <div className="relative w-full max-w-7xl h-[85vh] min-h-[500px] mx-auto px-4">
            <Image
              src="/productmattress.jpg"
              alt={featuredProduct.name}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        </section>
      )}

      {/* Section 2: Two Column - Materials Info & Product Image */}
      {featuredProductDetail && (
        <section className="py-16 px-4" style={{ backgroundColor: "#EED9C4" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column: Text Content */}
              <div className="space-y-6">
                {/* Large serif title */}
                <h2 className="text-2xl md:text-4xl font-serif font-medium text-black mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Crafting Excellence
                </h2>
                
                {/* Description paragraph */}
                <p className="text-black leading-relaxed font-medium text-lg mb-8">
                  Our mattresses are crafted using the finest raw materials sourced from certified farms and trusted suppliers. Each material undergoes rigorous quality testing to ensure it meets our high standards. From organic cotton covers that provide natural breathability to premium memory foam layers that contour to your body, every component is carefully selected and processed to deliver the ultimate sleep experience. 
                </p>
                
                {/* List of process steps */}
                <div className="space-y-3">
                  <div className="text-black font-sans uppercase tracking-wide">
                    Organic Cotton Sourcing
                  </div>
                  <div className="text-black font-sans uppercase tracking-wide">
                    Premium Foam Processing
                  </div>
                  <div className="text-black font-sans uppercase tracking-wide">
                    Natural Latex Extraction
                  </div>
                  <div className="text-black font-sans uppercase tracking-wide">
                    Quality Certification
                  </div>
                  <div className="text-black font-sans uppercase tracking-wide">
                    Sustainable Manufacturing
                  </div>
                </div>
              </div>

              {/* Right Column: Product Image */}
              <div className="relative w-full overflow-hidden rounded-lg group" style={{ aspectRatio: '4/3' }}>
                <Image
                  src="/cotton.jpg"
                  alt="Organic Cotton Sourcing"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Products Carousel */}
      {filteredProducts.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-medium text-black mb-8 text-center">Explore Our Products</h2>
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {filteredProducts.map((product) => {
                    const productDetail = getProductDetailById(product.id)
                    const defaultPrice = productDetail?.sizes[0]?.price || product.price
                    
                    return (
                      <CarouselItem
                        key={product.id}
                        className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                      >
                        <div 
                          onClick={() => handleProductBuyNow(product.id)}
                          className="group p-4 hover:shadow-lg transition-shadow border cursor-pointer" 
                          style={{ borderColor: "#D9CFC7" }}
                        >
                          <div className="relative aspect-square mb-4 overflow-hidden bg-stone-50">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-black line-clamp-2 min-h-12">
                            {product.name}
                          </h3>
                          <p className="mb-3 text-base font-medium text-gray-600">{product.firmness} Firmness</p>
                          <div className="flex items-center gap-1 text-black">
                            <IndianRupee className="w-4 h-4" />
                            <span className="text-lg font-medium">
                              {defaultPrice.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#D9CFC7" }} />
                <CarouselNext className="right-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#D9CFC7" }} />
              </Carousel>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Baby Mattresses Carousel */}
      {babyProducts.length > 0 && (
        <section className="py-16 px-4 bg-white border-t" style={{ borderColor: "#D9CFC7" }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-medium text-black mb-8 text-center">Baby Mattresses</h2>
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {babyProducts.map((product) => {
                    const productDetail = getProductDetailById(product.id)
                    const defaultPrice = productDetail?.sizes[0]?.price || product.price
                    
                    return (
                      <CarouselItem
                        key={product.id}
                        className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                      >
                        <div 
                          onClick={() => handleBabyBuyNow(product.id)}
                          className="group p-4 hover:shadow-lg transition-shadow border cursor-pointer" 
                          style={{ borderColor: "#DCC5B2" }}
                        >
                          <div className="relative aspect-square mb-4 overflow-hidden bg-stone-50">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-black line-clamp-2 min-h-12">
                            {product.name}
                          </h3>
                          <p className="mb-3 text-base font-medium text-gray-600">{product.firmness} Firmness</p>
                          <div className="flex items-center gap-1 text-black">
                            <IndianRupee className="w-4 h-4" />
                            <span className="text-lg font-medium">
                              {defaultPrice.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#DCC5B2" }} />
                <CarouselNext className="right-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#DCC5B2" }} />
              </Carousel>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

