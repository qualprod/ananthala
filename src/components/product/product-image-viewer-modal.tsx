"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MagnifyImage } from "@/components/product/MagnifyImage"

interface ProductImageViewerModalProps {
  images: string[]
  initialIndex: number
  productName: string
  isOpen: boolean
  onClose: () => void
}

export function ProductImageViewerModal({
  images,
  initialIndex,
  productName,
  isOpen,
  onClose,
}: ProductImageViewerModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(initialIndex)
  
  useEffect(() => {
    if (!isOpen) return
    setSelectedImageIndex(initialIndex)
  }, [initialIndex, isOpen])

  if (!isOpen) return null

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="w-[94vw] md:w-[80vw] max-w-[1450px] h-[90vh] md:h-[86vh] bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 bg-white border-b border-gray-200">
          <h2 className="text-black text-lg font-semibold text-center">{productName}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-4 text-black hover:bg-black/5"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
          {/* Main Image Container */}
          <div className="relative w-full h-full flex items-center justify-center px-4 py-4 md:px-8">
            <div className="w-full max-w-6xl">
              <MagnifyImage
                src={images[selectedImageIndex]}
                alt={`${productName} - image ${selectedImageIndex + 1}`}
                className="mx-auto max-h-[78vh] md:max-h-[82vh] bg-white rounded-lg"
                imgClassName="object-contain"
                enableHoverZoom
                enableMobileTapZoom
                showMobileHint
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevImage()
                  }}
                  className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-black/10 hover:bg-black/20 text-black rounded-full p-3 transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextImage()
                  }}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-black/10 hover:bg-black/20 text-black rounded-full p-3 transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controls and Thumbnails */}
        <div className="border-t border-gray-200 bg-white p-4">
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleThumbnailClick(index)
                  }}
                  className={`shrink-0 relative w-16 h-16 overflow-hidden rounded-md border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-black opacity-100"
                      : "border-gray-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Image Counter */}
          <div className="text-center text-black/70 text-sm mt-2">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  )
}
