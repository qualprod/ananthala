"use client"

import { useRef } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { CustomerTestimonialVideos } from "@/components/sections/customer-testimonial-videos"
import { CategoryProductsGrid } from "@/components/sections/category-products-grid"

export default function EssentialsPage() {
  const shopSectionRef = useRef<HTMLElement>(null)
  const aboutUsSectionRef = useRef<HTMLElement>(null)

  const scrollToShop = () => {    shopSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToAboutUs = () => {
    aboutUsSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="fixed top-20 left-0 right-0 z-40 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="py-2">
              <ol className="flex items-center gap-2 text-base">
                <li>
                  <Link href="/" className="text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </li>
                <li className="text-foreground font-medium">Curated Essentials</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="h-[49px]"></div>

        <section className="relative w-full">
          <Image
            src="/MainHeaderImage.jpg"
            alt="Curated Essentials"
            width={1890}
            height={1063}
            className="w-full h-auto block"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 z-10 flex items-end md:items-center">
            <div className="flex w-full flex-col gap-5 px-4 sm:px-6 lg:px-8 xl:px-12 pb-8 sm:pb-10 md:pb-0 md:flex-row md:items-start md:justify-between">
              <div className="order-2 flex flex-col sm:flex-row gap-4 md:order-1 md:pt-44">
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
              <div className="order-1 max-w-[260px] sm:max-w-sm md:max-w-md space-y-5 md:order-2 md:text-left">
                <div className="bg-white/10 backdrop-blur-sm p-3 md:p-8 rounded-lg">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white font-cormorant">
                    Curated Essentials
                  </h1>
                  <p className="text-white text-sm md:text-lg mt-3 md:mt-4 leading-relaxed font-medium max-w-[220px] sm:max-w-xs md:max-w-none">
                    Fine complements, hand picked keeping in mind your comfort and higher taste
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="shop" ref={shopSectionRef} className="py-16 px-4 bg-stone-50">
          <div className="max-w-[1800px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-8 text-center font-cormorant">
              Shop
            </h2>
            <CategoryProductsGrid collection="essentials" />
          </div>
        </section>

        <CustomerTestimonialVideos />

        <section ref={aboutUsSectionRef} className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              <div className="relative aspect-[4/3] overflow-hidden max-w-lg mx-auto lg:mx-0">
                <Image src="/Bullock Cart Theme.png" alt="About Ananthala" fill className="object-cover" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-medium text-foreground font-cormorant">
                  Our Crafted Heritage
                </h2>
                <ul className="mt-3 space-y-3 mb-4 list-disc pl-6 text-lg text-foreground font-medium">
                <li>Rooted in the early 20th century, our journey is shaped by a deep bond with nature and generations of craftsmanship.</li>
                <li>We create refined, nature-led products that elevate everyday living through purity, simplicity, and enduring design.</li>
                <li>Using the finest cotton and responsibly sourced timber, untouched by synthetics, we honour both material and method.</li>
                <li>Each piece reflects quiet precision - crafted to last, and to restore balance to body and mind.</li>
                <li>Guided by a responsibility to the land, we create with care for both present and future.</li>
                <li>This is our legacy - where heritage, nature, and understated luxury come together.</li>
              </ul>
              <Link href="/about">
                  <Button className="mt-4 bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground border-2 border-[#EED9C4] px-6 py-4 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105">
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
