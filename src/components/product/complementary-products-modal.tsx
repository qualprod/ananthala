"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

interface ComplementaryProduct {
  _id: string
  productTitle: string
  image: string | null
  basePrice: number
}

interface ComplementaryProductsModalProps {
  isOpen: boolean
  productId: string
  mainProductName: string
  onClose: () => void
  onConfirm: (selectedIds: string[]) => void
  isLoading?: boolean
}

export default function ComplementaryProductsModal({
  isOpen,
  productId,
  mainProductName,
  onClose,
  onConfirm,
  isLoading = false,
}: ComplementaryProductsModalProps) {
  const [complementaryProducts, setComplementaryProducts] = useState<ComplementaryProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchComplementaryProducts()
    }
  }, [isOpen, productId])

  const fetchComplementaryProducts = async () => {
    try {
      setIsFetching(true)
      setError(null)

      const response = await fetch(`/api/products/${productId}/complementary`)
      const data = await response.json()

      if (data.success) {
        setComplementaryProducts(data.complementaryProducts || [])
      } else {
        setError(data.message || "Failed to fetch complementary products")
      }
    } catch (err) {
      console.error("[v0] Error fetching complementary products:", err)
      setError("Failed to load free products")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === complementaryProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(complementaryProducts.map((p) => p._id)))
    }
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedProducts))
    setSelectedProducts(new Set())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-5xl max-h-[92vh] overflow-y-auto bg-white p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#D9CFC7] p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold text-[#4A2F1F]">
                {complementaryProducts.length > 0 ? "Free Complimentary Products included!" : "Complete Your Order"}
              </DialogTitle>
              <DialogDescription className="text-[#6D4530] mt-2 text-base">
                {complementaryProducts.length > 0
                  ? "We value your patronage and as a gesture of gratitude, we would like to offer some of our fine products free of cost to compliment your purchase."
                  : `Proceeding to add "${mainProductName}" to your cart.`}
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5A3C]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : complementaryProducts.length > 0 ? (
            <div className="space-y-6">
              {/* Select All Option */}
              <div className="border-2 border-[#D9CFC7] rounded-xl p-5 flex items-center gap-4 hover:bg-[#F5F1ED]/50 transition cursor-pointer" onClick={handleSelectAll}>
                <Checkbox
                  checked={selectedProducts.size === complementaryProducts.length}
                  onCheckedChange={handleSelectAll}
                  className="w-6 h-6"
                />
                <span className="font-bold text-lg text-[#4A2F1F]">
                  Select All ({selectedProducts.size}/{complementaryProducts.length})
                </span>
              </div>

              {/* Products Grid - Under Cards Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {complementaryProducts.map((product) => (
                  <div
                    key={product._id}
                    className={`border-2 rounded-xl overflow-hidden transition cursor-pointer ${
                      selectedProducts.has(product._id)
                        ? "border-[#8B5A3C] bg-[#FFF8F4] shadow-md"
                        : "border-[#D9CFC7] hover:border-[#8B5A3C] hover:shadow-md"
                    }`}
                    onClick={() => handleSelectProduct(product._id)}
                  >
                    {/* Product Card */}
                    <div className="p-6 space-y-4">
                      {/* Image and Checkbox Row */}
                      <div className="flex gap-5 items-start">
                        {/* Product Image */}
                        <div className="shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-[#F5F1ED]">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.productTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#E8E0D8]">
                              <span className="text-[#6D4530] text-xs text-center">No image</span>
                            </div>
                          )}
                        </div>

                        {/* Checkbox */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedProducts.has(product._id)}
                            onCheckedChange={() => handleSelectProduct(product._id)}
                            className="w-6 h-6 mt-1"
                          />
                        </div>
                      </div>

                      {/* Product Info - Under Card */}
                      <div className="pl-0 space-y-2">
                        <h3 className="font-bold text-lg text-[#4A2F1F] leading-tight">
                          {product.productTitle}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-bold">
                            FREE
                          </Badge>
                          {product.basePrice > 0 && (
                            <span className="text-sm text-[#6D4530] font-medium">
                              Worth ₹{product.basePrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <p className="text-lg text-[#4A2F1F] font-medium">No free products available at this time</p>
                <p className="text-[#6D4530]">Let's proceed with adding your product to cart.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#D9CFC7] p-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#D9CFC7] text-[#4A2F1F] px-6 py-2 text-base"
            disabled={isLoading}
          >
            {complementaryProducts.length > 0 ? "Skip for Now" : "Cancel"}
          </Button>
          <Button
            className="bg-[#8B5A3C] text-white hover:bg-[#6D4530] px-6 py-2 text-base"
            onClick={handleConfirm}
            disabled={(complementaryProducts.length > 0 && selectedProducts.size === 0) || isLoading}
          >
            {complementaryProducts.length > 0
              ? `Add Selected to Cart (${selectedProducts.size})`
              : "Proceed to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
