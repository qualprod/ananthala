"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { CustomerTestimonialVideos } from "@/components/sections/customer-testimonial-videos"
import { CategoryProductsGrid } from "@/components/sections/category-products-grid"

export default function BlissPage() {
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
                  Bliss
                </li>
              </ol>
            </nav>
          </div>
        </div>
        {/* Spacer to prevent content from going under fixed breadcrumb */}
        <div className="h-[49px]"></div>
        {/* 1. Hero Section - Mattress Image */}
        <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/bliss.jpeg"
              alt="Premium Mattress"
              fill
              className="object-cover object-top"
              priority
            />
            {/* Overlay content with right-aligned text and left CTA */}
            <div className="absolute inset-0 z-10 flex items-center">
              <div className="flex w-full flex-col gap-6 px-4 sm:px-6 lg:px-8 xl:px-12 pt-12 sm:pt-14 md:pt-0 md:flex-row md:items-start md:justify-between">
                <div className="order-2 flex flex-col sm:flex-row gap-4 md:order-1 md:pt-44">
                  <Button 
                    onClick={scrollToShop}
                    className="bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground px-8 py-6 text-lg rounded-md w-full sm:w-auto sm:min-w-[140px]"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    Shop
                  </Button>
                  <Button
                    onClick={scrollToAboutUs}
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-[#8B5A3C] px-8 py-6 text-lg bg-transparent rounded-md w-full sm:w-auto sm:min-w-[140px]"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    Learn More
                  </Button>
                </div>
                <div className="order-1 max-w-md space-y-6 md:order-2 md:text-left">
                  <div className="bg-white/10 backdrop-blur-sm p-4 md:p-8 rounded-lg">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white font-cormorant">
                      Bliss
                    </h1>
                    <p className="text-white text-base md:text-lg mt-4 leading-relaxed font-medium">
                      Our Active range for the ones in their prime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ananthala Difference Section - Carousel */}
        <section ref={shopSectionRef} className="py-16 px-4 bg-white">
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
                      image: "/Ananthala Diff 1.png",
                      title: "Ananthala Difference",
                      description:
                        "Our Bliss range includes supports an active design architecture offering more resilience to bed time activity.",
                    },
                    {
                      id: 2,
                      image: "/Joy-Grace-Bliss 3.png",
                      title: "Ananthala Difference",
                      description:
                        "At Ananthala, our craftsmen choose the finest and the most suitable inputs that go into making your products.",
                    },
                    {
                      id: 3,
                      image: "/Ananthala Diff 3.png",
                      title: "Ananthala Difference",
                      description:
                        "Wake up fresh and loved ! You have the world to conquer.",
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
                            className={slide.id === 2 ? "object-cover object-top" : "object-cover"}
                          />
                        </div>
                        
                        {/* Right Side - Text Content with Card */}
                        <div className="space-y-6 p-6 pb-8 pr-8 sm:p-8 lg:py-8 lg:pr-10 lg:pl-0 self-center text-center flex flex-col justify-center h-full">
                         
                          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium font-cormorant text-foreground">
                            Ananthala Difference
                          </h1>
                          <div className="text-lg md:text-xl uppercase tracking-wider font-medium text-foreground">
                            BLISS COLLECTION
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

        {/* Shop Section */}
        <section id="shop" className="py-16 px-4 bg-stone-50">
          <div className="max-w-[1800px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-8 text-center font-cormorant">
              Shop
            </h2>
            <CategoryProductsGrid collection="bliss" />
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
