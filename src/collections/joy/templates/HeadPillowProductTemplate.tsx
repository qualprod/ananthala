"use client"

import { useRef } from "react"
import type { ProductDetail } from "@/data/product-details"
import type { CartItem } from "@/components/cart/cart-drawer"
import { HeadPillowConfigurator } from "@/collections/joy/components/head-pillow-configurator"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sprout, Waves, SprayCan, XCircle, Layers, Grid } from "lucide-react"

interface TestimonialVideo {
  id: number
  video: string
  poster: string
  name: string
}

const testimonialVideos: TestimonialVideo[] = [
  {
    id: 1,
    video: "/ananthala hero section video.mp4",
    poster: "/pillow.jpg",
    name: "Sarah Johnson",
  },
  {
    id: 2,
    video: "/ananthala hero section video.mp4",
    poster: "/pillow.jpg",
    name: "Michael Chen",
  },
  {
    id: 3,
    video: "/ananthala hero section video.mp4",
    poster: "/pillow.jpg",
    name: "Emily Rodriguez",
  },
  {
    id: 4,
    video: "/ananthala hero section video.mp4",
    poster: "/pillow.jpg",
    name: "David Thompson",
  },
  {
    id: 5,
    video: "/ananthala hero section video.mp4",
    poster: "/pillow.jpg",
    name: "Priya Sharma",
  },
  {
    id: 6,
    video: "/ananthala hero section video.mp4",
    poster: "/pillow.jpg",
    name: "James Wilson",
  },
]

interface HeadPillowProductTemplateProps {
  product: ProductDetail
  productId: number
  onAddToCart: (items: CartItem[]) => void
  isAddingToCart: boolean
}

export function HeadPillowProductTemplate({
  product,
  productId,
  onAddToCart,
  isAddingToCart,
}: HeadPillowProductTemplateProps) {
  const aboutUsSectionRef = useRef<HTMLElement>(null)
  return (
    <div className="space-y-12">
      <HeadPillowConfigurator
        product={product}
        onAddToCart={onAddToCart}
        isAddingToCart={isAddingToCart}
      />

      <section className="w-full bg-white py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-12 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Sprout className="w-6 h-6 text-foreground stroke-[1.5]" />
              </div>
              <p className="text-base md:text-lg font-medium text-foreground">100% Organic Cotton</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Waves className="w-6 h-6 text-foreground stroke-[1.5]" />
              </div>
              <p className="text-base md:text-lg font-medium text-foreground">Maximum Absorbency</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <SprayCan className="w-6 h-6 text-foreground stroke-[1.5]" />
              </div>
              <p className="text-base md:text-lg font-medium text-foreground">No Artificial Softeners</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <XCircle className="w-6 h-6 text-foreground stroke-[1.5]" />
              </div>
              <p className="text-base md:text-lg font-medium text-foreground">Anti-Pill</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Layers className="w-6 h-6 text-foreground stroke-[1.5]" />
              </div>
              <p className="text-base md:text-lg font-medium text-foreground">Plush, 700 GSM</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Grid className="w-6 h-6 text-foreground stroke-[1.5]" />
              </div>
              <p className="text-base md:text-lg font-medium text-foreground">Generously Sized</p>
            </div>
          </div>

          <div className="max-w-8xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="description" className="border-2 border-[#EED9C4] px-4">
                <AccordionTrigger className="text-lg font-medium text-foreground hover:no-underline">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed">
                  <p className="mb-4">
                    {product.description}
                  </p>
                  <p className="mb-4">
                    Our premium head pillow is designed with your baby's comfort and health in mind. 
                    Each pillow is crafted using the finest organic materials and innovative technology 
                    to ensure the perfect support for your little one's head and neck.
                  </p>
                  <p>
                    With maximum comfort and support, this head pillow is built to last while 
                    maintaining its premium quality. Available in standard and custom dimensions to fit 
                    your specific needs.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping" className="border-2 border-[#EED9C4] px-4 last:!border-b-2">
                <AccordionTrigger className="text-lg font-medium text-foreground hover:no-underline">
                  Shipping information
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Delivery Time</h4>
                      <p>
                        Standard delivery: 5-7 business days<br />
                        Express delivery: 2-3 business days (available at checkout)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Shipping Charges</h4>
                      <p>
                        Free shipping on orders above ₹5,000<br />
                        Standard shipping: ₹200<br />
                        Express shipping: ₹500
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Custom Orders</h4>
                      <p>
                        Customized products (with selected dimensions and fabrics) may take 7-10 business days 
                        for production before shipping. You will receive a tracking number once your order ships.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Returns & Exchanges</h4>
                      <p>
                        We offer a 30-day return policy for unused items in original packaging. 
                        Custom orders are non-returnable unless there is a manufacturing defect.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Feature 1: Softer, Smoother Slumber */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-square overflow-hidden max-w-md mx-auto lg:mx-0">
              <Image
                src="/cotton.jpg"
                alt="Softer, Smoother Slumber"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-4 font-cormorant">
                SOFTER, SMOOTHER SLUMBER
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Woven using a 4 under 1 sateen weave that imparts a silky-smooth finish and a subtle sheen, while maintaining its strength, the resultant sheets are both elegant and long-lasting.
              </p>
            </div>
          </div>

          {/* Feature 2: 100% Organic Cotton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-4 font-cormorant">
                100% ORGANIC COTTON
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Crafted from the rarest 100% organic cotton, sourced directly from farms to ensure premium quality. The extra-long staple cotton enhances the smoothness and breathability, offering a luxurious feel and a healthier sleeping environment.
              </p>
            </div>
            <div className="relative aspect-square overflow-hidden max-w-md mx-auto lg:mx-0">
              <Image
                src="/cotton.jpg"
                alt="100% Organic Cotton"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Feature 3: Highly Breathable */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-square overflow-hidden max-w-md mx-auto lg:mx-0">
              <Image
                src="/cotton.jpg"
                alt="Highly Breathable"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-4 font-cormorant">
                HIGHLY BREATHABLE
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Unlike synthetic options that can trap heat and block aeration, our organic bed sheets offer superior breathability. This natural airflow helps to regulate temperature and wick away moisture, ensuring a cooler, more comfortable sleep and reducing the need for restless tossing and turning.
              </p>
            </div>
          </div>

          {/* Feature 4: Say Good-bye to Fuzz Balls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-4 font-cormorant">
                SAY GOOD-BYE TO FUZZ BALLS
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Designed for durability, our bed sheets feature a single-ply yarn with a 300 thread count, which helps prevent pilling. This construction ensures that the sheets retain their pristine appearance and texture, even after frequent use and washing.
              </p>
            </div>
            <div className="relative aspect-square overflow-hidden max-w-md mx-auto lg:mx-0">
              <Image
                src="/cotton.jpg"
                alt="Say Good-bye to Fuzz Balls"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-4xl lg:text-4xl font-medium text-foreground mb-4 text-balance">
              What Our Divas Say
            </h2>
            <p className="text-xl sm:text-2xl text-foreground font-medium">Join thousands of happy sleepers</p>
          </div>

          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {testimonialVideos.map((testimonial) => (
                  <CarouselItem
                    key={testimonial.id}
                    className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-video overflow-hidden border border-[#EED9C4]">
                        <video
                          className="w-full h-full object-cover"
                          controls
                          controlsList="nodownload nofullscreen noremoteplayback"
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          poster={testimonial.poster}
                        >
                          <source src={testimonial.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <p className="text-left text-foreground font-semibold text-lg">
                        {testimonial.name}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#EED9C4" }} />
              <CarouselNext className="right-0 bg-white border-2 shadow-md hover:bg-gray-50" style={{ borderColor: "#EED9C4" }} />
            </Carousel>
          </div>

          <div className="text-center mt-8">
            <p className="text-foreground text-lg font-semibold">Rated 4.9/5 from over 10,000 reviews</p>
          </div>
        </div>
      </section>
 {/* About Us Section */}
 <section ref={aboutUsSectionRef} className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              <div className="relative aspect-[4/3] overflow-hidden max-w-lg mx-auto lg:mx-0">
                <Image
                  src="/mattress.jpg"
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
    </div>
  )
}
