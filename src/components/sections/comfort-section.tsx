"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

export function ComfortSection() {
  const router = useRouter()

  return (
    <section className="py-24 px-4 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p
              className="text-3xl font-bold mb-2"
              style={{ color: "#000000" }}
            >
              Crafted for Comfort
            </p>
            <h2 className="mb-6 text-lg" style={{ color: "#000000" }}>
              The Science of Better Sleep
            </h2>
            <ul className="mt-3 space-y-3 mb-8 list-disc pl-6" style={{ color: "#000000" }}>
              <li>Rooted in the early 20th century, our journey is shaped by a deep bond with nature and generations of craftsmanship.</li>
              <li>We create refined, nature-led products that elevate everyday living through purity, simplicity, and enduring design.</li>
              <li>Using the finest cotton and responsibly sourced timber, untouched by synthetics, we honour both material and method.</li>
              <li>Each piece reflects quiet precision - crafted to last, and to restore balance to body and mind.</li>
              <li>Guided by a responsibility to the land, we create with care for both present and future.</li>
              <li>This is our legacy - where heritage, nature, and understated luxury come together.</li>
            </ul>
            <button
              onClick={() => router.push("/about")}
              className="bg-[#6B563F] text-white px-8 py-3 hover:bg-amber-950 transition-colors"
            >
              About us
            </button>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1590924439021-85cdab4bca41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21mb3J0YWJsZSUyMGJlZCUyMHNsZWVwfGVufDF8fHx8MTc2NDE3NTUwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Comfort"
                fill
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

