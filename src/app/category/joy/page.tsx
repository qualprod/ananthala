"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Image from "next/image"
import Link from "next/link"

import { useEffect, useRef, useState } from "react"
import { ChevronRight } from "lucide-react"


import { useCart } from "@/contexts/cart-context"
import { type CartItem } from "@/components/cart/cart-drawer"
import { CustomerTestimonialVideos } from "@/components/sections/customer-testimonial-videos"
import { CategoryProductsGrid } from "@/components/sections/category-products-grid"

export default function JoyPage() {
  const [hamperSelected, setHamperSelected] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bedSpreadColor, setBedSpreadColor] = useState("")
  const [pillowSize, setPillowSize] = useState("")
  const [swaddleSelected, setSwaddleSelected] = useState(false)
  const [selectedHamperImage, setSelectedHamperImage] = useState(0)
  const [mattressVariant, setMattressVariant] = useState("")
  const [mattressDimension, setMattressDimension] = useState("")
  const [mattressFabric, setMattressFabric] = useState("")
  const [mattressApplicator, setMattressApplicator] = useState("")
  const [selectedColor, setSelectedColor] = useState("royal-blue")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingHamper, setIsAddingHamper] = useState(false)
  const [isAddingMattress, setIsAddingMattress] = useState(false)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const [addingSwaddleType, setAddingSwaddleType] = useState<string | null>(null)

  // Color to images mapping
  const colorImages: Record<string, string[]> = {
    "royal-blue": ["/productmattress.jpg", "/topper.jpg", "/lounger.jpg", "/pillow.jpg", "/bumpers.jpg"],
    gray: ["/topper.jpg", "/productmattress.jpg", "/lounger.jpg", "/pillow.jpg", "/bumpers.jpg"],
    black: ["/lounger.jpg", "/productmattress.jpg", "/topper.jpg", "/pillow.jpg", "/bumpers.jpg"],
    "dark-brown": ["/bumpers.jpg", "/productmattress.jpg", "/topper.jpg", "/lounger.jpg", "/pillow.jpg"],
  }

  const colors = [
    { name: "royal-blue", label: "Royal Blue", hex: "#4169E1", overlay: "rgba(65, 105, 225, 0.5)", blendMode: "overlay" },
    { name: "gray", label: "Gray", hex: "#4A4A4A", overlay: "rgba(74, 74, 74, 0.4)", blendMode: "multiply" },
    { name: "black", label: "Black", hex: "#000000", overlay: "rgba(0, 0, 0, 0.3)", blendMode: "multiply" },
    { name: "dark-brown", label: "Dark Brown", hex: "#5C4033", overlay: "rgba(92, 64, 51, 0.5)", blendMode: "overlay" },
  ]

  const selectedColorData = colors.find(c => c.name === selectedColor) || colors[0]

  const currentImages = colorImages[selectedColor] || colorImages["royal-blue"]

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setSelectedImageIndex(0) // Reset to first image when color changes
  }
  
  const hamperImages = [
    { src: "/productmattress.jpg", item: "Mattress" },
    { src: "/topper.jpg", item: "Topper" },
    { src: "/lounger.jpg", item: "Lounger" },
    { src: "/pillow.jpg", item: "Head Pillow" },
    { src: "/bumpers.jpg", item: "Pillow Bumpers" },
  ]

  const babyProducts = [
    { id: "mattress", name: "Mattress", price: 299, image: "/productmattress.jpg", productDetailId: 7 },
    { id: "topper", name: "Topper", price: 149, image: "/topper.jpg", productDetailId: 8 },
    { id: "lounger", name: "Lounger", price: 199, image: "/lounger.jpg", productDetailId: 9 },
    { id: "head-pillow", name: "Head Pillow", price: 79, image: "/pillow.jpg", productDetailId: 10 },
    { id: "pillow-bumpers", name: "Pillow Bumpers", price: 89, image: "/bumpers.jpg", productDetailId: 11 },
  ]

  const shopSectionRef = useRef<HTMLElement>(null)
  const aboutUsSectionRef = useRef<HTMLElement>(null)
  const [differenceCarouselApi, setDifferenceCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!differenceCarouselApi) return

    const autoScroll = window.setInterval(() => {
      differenceCarouselApi.scrollNext()
    }, 4000)

    return () => window.clearInterval(autoScroll)
  }, [differenceCarouselApi])

  const scrollToShop = () => {
    shopSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToAboutUs = () => {
    aboutUsSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const { addToCart } = useCart()

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const handleAddHamperToCart = async () => {
    setIsAddingHamper(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Get items to add: if hamperSelected is true, add all products; otherwise add only selected items
    const itemsToAdd = hamperSelected 
      ? babyProducts 
      : babyProducts.filter(product => selectedItems.includes(product.id))
    
    itemsToAdd.forEach((product) => {
      const sizeInfo = product.id === "mattress" && mattressDimension 
        ? `${mattressVariant || "Standard"} - ${mattressDimension}${mattressApplicator ? ` - ${mattressApplicator}` : ""}`
        : "Standard"
      
      const colorInfo = selectedColor ? ` - ${colors.find(c => c.name === selectedColor)?.label || selectedColor}` : ""
      
      const cartItem: CartItem = {
        id: `joy-hamper-${product.id}-${selectedColor}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: `JOY ${product.name}`,
        image: product.id === "mattress" ? currentImages[0] : product.image,
        size: `${sizeInfo}${colorInfo}`,
        quantity: 1,
        price: product.price,
      }
      addToCart(cartItem)
    })
    
    // Add complimentary bed spread if color is selected
    if (bedSpreadColor) {
      const colorLabel = bedSpreadColor.charAt(0).toUpperCase() + bedSpreadColor.slice(1)
      const bedSpreadItem: CartItem = {
        id: `joy-bedspread-${bedSpreadColor}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: "JOY Bed Spread (Complimentary)",
        image: "/bedsheet.jpg",
        size: colorLabel,
        quantity: 1,
        price: 0,
      }
      addToCart(bedSpreadItem)
    }
    
    // Add complimentary pillow if size is selected
    if (pillowSize) {
      const pillowItem: CartItem = {
        id: `joy-pillow-${pillowSize}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: "JOY Pillow (Complimentary)",
        image: "/pillow.jpg",
        size: pillowSize,
        quantity: 1,
        price: 0,
      }
      addToCart(pillowItem)
    }
    
    setHamperSelected(true)
    setIsAddingHamper(false)
  }

  const handleAddProductToCart = async (productId: string) => {
    setAddingProductId(productId)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const product = babyProducts.find(p => p.id === productId)
    if (product) {
      const sizeInfo = productId === "mattress" && mattressDimension 
        ? `${mattressVariant || "Standard"} - ${mattressDimension}${mattressApplicator ? ` - ${mattressApplicator}` : ""}`
        : "Standard"
      
      const cartItem: CartItem = {
        id: `joy-${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: `JOY ${product.name}`,
        image: product.image,
        size: sizeInfo,
        quantity: 1,
        price: product.price,
      }
      addToCart(cartItem)
    }
    
    setHamperSelected(false)
    toggleItem(productId)
    setAddingProductId(null)
  }

  const handleAddSwaddleToCart = async (swaddleType: string) => {
    setAddingSwaddleType(swaddleType)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const cartItem: CartItem = {
      id: `joy-swaddle-${swaddleType.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: `JOY ${swaddleType} Swaddle`,
      image: "/cotton.jpg",
      size: "Standard",
      quantity: 1,
      price: 49,
    }
    addToCart(cartItem)
    
    setSwaddleSelected(true)
    setAddingSwaddleType(null)
  }

  const handleAddMattressToCart = async () => {
    setIsAddingMattress(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const sizeInfo = `${mattressVariant || "Standard"} - ${mattressDimension || "Standard"}${mattressFabric ? ` - ${mattressFabric}` : ""}${mattressApplicator ? ` - ${mattressApplicator}` : ""}`
    
    const mattressItem: CartItem = {
      id: `joy-mattress-${mattressVariant}-${mattressDimension}-${selectedColor}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: "JOY Mattress",
      image: currentImages[0],
      size: `${sizeInfo}${selectedColor ? ` - ${colors.find(c => c.name === selectedColor)?.label || selectedColor}` : ""}`,
      quantity: 1,
      price: 299,
    }
    addToCart(mattressItem)
    
    // Add complimentary pillow if size is selected
    if (pillowSize) {
      const pillowItem: CartItem = {
        id: `joy-pillow-${pillowSize}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: "JOY Pillow (Complimentary)",
        image: "/pillow.jpg",
        size: pillowSize,
        quantity: 1,
        price: 0,
      }
      addToCart(pillowItem)
    }
    
    // Add complimentary bed spread if color is selected
    if (bedSpreadColor) {
      const bedSpreadItem: CartItem = {
        id: `joy-bedspread-${bedSpreadColor}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: "JOY Bed Spread (Complimentary)",
        image: "/bedsheet.jpg",
        size: bedSpreadColor,
        quantity: 1,
        price: 0,
      }
      addToCart(bedSpreadItem)
    }
    
    setIsAddingMattress(false)
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Fixed Breadcrumb */}
        <div className="fixed top-20 left-0 right-0 z-40 bg-white">
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
                <li className="text-foreground font-medium">
                  Joy
                </li>
              </ol>
            </nav>
          </div>
        </div>
        {/* Spacer to prevent content from going under fixed breadcrumb */}
        <div className="h-[49px]"></div>
        {/* 1. Hero Section - Baby Products Image */}
        <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/joy.png"
              alt="Baby Products"
              fill
              className="object-cover object-[center_20%]"
              priority
            />
            {/* Overlay content on the left */}
            <div className="absolute inset-0 z-10 flex items-end md:items-center">
              <div className="pl-4 sm:pl-6 lg:pl-8 xl:pl-12 pb-8 sm:pb-10 md:pb-0">
                <div className="max-w-md space-y-5">
                  <div className="bg-white/10 backdrop-blur-sm p-3 md:p-8 rounded-lg max-w-[260px] sm:max-w-sm md:max-w-md">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white font-cormorant">
                      Joy
                    </h1>
                  
                    <p className="text-white text-sm md:text-lg mt-3 md:mt-4 leading-relaxed font-medium max-w-[220px] sm:max-w-xs md:max-w-none">
                      Baby and Kids products focused on nurturing the young
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={scrollToShop}
                      className="bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground px-8 py-4 text-lg rounded-md w-full sm:w-auto sm:min-w-[140px]"
                      style={{ fontFamily: '"Playfair Display", serif' }}
                    >
                      Shop
                    </Button>
                    <Button
                      onClick={scrollToAboutUs}
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white hover:text-[#8B5A3C] px-8 py-4 text-lg bg-transparent rounded-md w-full sm:w-auto sm:min-w-[140px]"
                      style={{ fontFamily: '"Playfair Display", serif' }}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ananthala Difference Section - Carousel */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
                setApi={setDifferenceCarouselApi}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {[
                    {
                      id: 1,
                      image: "/Joy-Grace-Bliss 3.png",                      title: "Ananthala Difference",
                      description:
                        "At Ananthala, our craftsmen choose the finest and the most suitable inputs that make your baby's products.",
                    },
                    {
                      id: 2,
                      image: "/Joy 2.png",
                      title: "Ananthala Difference",
                      description:
                        "We want to be active partners in helping you bring up your kids healthy, happy and fit - by staying close to nature !",
                    },
                    {
                      id: 3,
                      image: "/Joy 1.png",
                      title: "Ananthala Difference",
                      description:
                        "All our products are custom made based on your and your baby's needs. Odd measurements, different cribs, we have your back !",
                    },
                  ].map((slide) => (
                    <CarouselItem
                      key={slide.id}
                      className="pl-2 md:pl-4 basis-full"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-12 items-start bg-[#EED9C4] pr-0 sm:pr-8">
                        {/* Left Side - Image */}
                        <div className="relative aspect-[3/2] overflow-hidden">
                          <Image
                            src={slide.image || "/placeholder.svg"}
                            alt={slide.title}
                            fill
                            className={
                              slide.id === 1
                                ? "object-cover object-top"
                                : slide.id === 2
                                  ? "object-cover object-[center_45%]"
                                  : slide.id === 3
                                    ? "object-cover object-[center_25%]"
                                    : "object-cover"
                            }
                          />
                        </div>
                        
                        {/* Right Side - Text Content with Card */}
                        <div className="space-y-6 p-6 pb-8 pr-8 sm:p-8 lg:py-8 lg:pr-10 lg:pl-0 self-center text-center flex flex-col justify-center h-full">
                         
                          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium font-cormorant text-foreground">
                            Ananthala Difference
                          </h1>
                          <div className="text-lg md:text-xl uppercase tracking-wider font-medium text-foreground">
                            JOY COLLECTION
                          </div>
                          <p className="text-xl leading-relaxed text-foreground mt-4">
                            {slide.description}
                          </p>
                          
                         
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#EED9C4" }} />
                <CarouselNext className="right-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#EED9C4" }} />
              </Carousel>
            </div>
          </div>
        </section>

       
        {/* Products Section */}
        <section id="shop" ref={shopSectionRef} className="py-16 px-4 bg-stone-50">
          <div className="max-w-[1800px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-8 text-center font-cormorant">
              Shop
            </h2>
            <CategoryProductsGrid collection="joy" />
          </div>
        </section>

        {/* Customer Testimonial Videos - Real from Database */}
        <CustomerTestimonialVideos />

        {/* About Us Section */}
        <section ref={aboutUsSectionRef} className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              <div className="relative w-full min-h-[240px] aspect-[4/3] overflow-hidden max-w-lg mx-auto lg:mx-0">
                <Image
                  src="/Bullock Cart Theme.png"
                  alt="About Ananthala"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-medium text-foreground font-cormorant">
                  Our Crafted Heritage
                </h2>
                <ul className="mt-3 space-y-3 mb-4 list-disc pl-6 text-lg text-foreground/90 font-medium">
                  <li>Rooted in the early 20th century, our journey is shaped by a deep bond with nature and generations of craftsmanship.</li>
                  <li>We create refined, nature-led products that elevate everyday living through purity, simplicity, and enduring design.</li>
                  <li>Using the finest cotton and responsibly sourced timber, untouched by synthetics, we honour both material and method.</li>
                  <li>Each piece reflects quiet precision - crafted to last, and to restore balance to body and mind.</li>
                  <li>Guided by a responsibility to the land, we create with care for both present and future.</li>
                  <li>This is our legacy - where heritage, nature, and understated luxury come together.</li>
                </ul>
                <Link href="/about">
                  <Button 
                    className="mt-4 bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground border-2 border-[#EED9C4] px-6 py-4 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

