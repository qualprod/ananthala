"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ProductDetail } from "@/data/product-details"
import { MagnifyImage } from "@/components/product/MagnifyImage"
import { ProductImageViewerModal } from "@/components/product/product-image-viewer-modal"

interface IndividualProductImageGalleryProps {
  product: ProductDetail
  selectedColor?: string
  colorImages?: Record<string, string[]>
}

/**
 * Individual Product Image Gallery Component
 * Handles image display for individual products with color variations
 */
export function IndividualProductImageGallery({
  product,
  selectedColor,
  colorImages,
}: IndividualProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Determine which images to show based on color selection
  const currentImages = selectedColor && colorImages
    ? (colorImages[selectedColor] || product.images)
    : product.images

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % currentImages.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <MagnifyImage
            src={currentImages[selectedImageIndex]}
            alt={product.name}
            className="h-full w-full"
            imgClassName="h-full"
            enableHoverZoom={false}
            enableMobileTapZoom={false}
            showMobileHint={false}
          />
          
          {/* Navigation Arrows */}
          {currentImages.length > 1 && (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-black" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {currentImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2 max-w-[320px] sm:max-w-[360px]">
            {currentImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                  selectedImageIndex === index
                    ? "border-[#D9A299] opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      <ProductImageViewerModal
        images={currentImages}
        initialIndex={selectedImageIndex}
        productName={product.name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
