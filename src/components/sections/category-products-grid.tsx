"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ApiProductVariant {
  price: number
}

interface ApiProduct {
  _id: string
  productType?: "single" | "hamper"
  productTitle: string
  category: string
  subCategory?: string
  primaryImage?: string
  imageUrls: string[]
  variants: ApiProductVariant[]
  hamperPrice?: number
  status: "visible" | "hidden"
  productRole?: "normal" | "complementary"
  displayOrder?: number | null
  createdAt?: string
}

interface CategoryProductsGridProps {
  collection: string
}

export function CategoryProductsGrid({ collection }: CategoryProductsGridProps) {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // If collection is "joy", "bliss", or "grace", filter by category
        const normalizedCollection = collection.toLowerCase()
        const isCategoryCollection = ["joy", "bliss", "grace"].includes(normalizedCollection)
        const apiUrl = isCategoryCollection
          ? `/api/products?category=${normalizedCollection}&status=visible`
          : "/api/products?status=visible"

        const response = await fetch(apiUrl)
        const data = await response.json()

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to fetch products")
        }

        if (isMounted) {
          setProducts(Array.isArray(data.products) ? data.products : [])
        }
      } catch (fetchError: any) {
        if (isMounted) {
          setError(fetchError.message || "Failed to fetch products")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [collection])

  const displayProducts = useMemo(() => {
    const normalizedCollection = collection.toLowerCase()
    const isCategoryCollection = ["joy", "bliss", "grace"].includes(normalizedCollection)

    // Filter out complementary products from all collections
    const nonComplementaryProducts = products.filter(
      (product) => product.productRole !== "complementary"
    )

    // If it's a category collection (joy, bliss, grace), products are already filtered by category from API
    // Otherwise, filter by subCategory
    const sortByDisplayOrder = (items: ApiProduct[]) =>
      [...items].sort((a, b) => {
        const aOrder = typeof a.displayOrder === "number" ? a.displayOrder : Number.POSITIVE_INFINITY
        const bOrder = typeof b.displayOrder === "number" ? b.displayOrder : Number.POSITIVE_INFINITY
        if (aOrder !== bOrder) return aOrder - bOrder
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })

    if (isCategoryCollection) {
      return sortByDisplayOrder(nonComplementaryProducts)
    }

    if (normalizedCollection === "essentials") {
      const essentialsCategories = new Set(["bedsheet", "pillow", "bedding", "mattress"])
      return sortByDisplayOrder(
        nonComplementaryProducts.filter((product) => essentialsCategories.has((product.category || "").toLowerCase())),
      )
    }

    const collectionMatches = nonComplementaryProducts.filter(
      (product) => product.subCategory?.toLowerCase() === normalizedCollection,
    )

    return sortByDisplayOrder(collectionMatches.length > 0 ? collectionMatches : nonComplementaryProducts)
  }, [collection, products])

  if (isLoading) {
    const skeletonItems = Array.from({ length: 8 }, (_, index) => index)
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,300px))] gap-x-8 gap-y-10 justify-center">
        {skeletonItems.map((item) => (
          <div
            key={`skeleton-${item}`}
            className="border border-[#EED9C4] p-4 bg-white"
          >
            <Skeleton className="mb-3 aspect-square w-full" />
            <Skeleton className="mb-2 h-4 w-3/4 mx-auto" />
            <Skeleton className="mb-3 h-4 w-1/2 mx-auto" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="py-10 text-center text-sm text-red-600">{error}</div>
  }

  if (displayProducts.length === 0) {
    const isEssentialsPage = collection.toLowerCase() === "essentials"
    if (isEssentialsPage) {
      return (
        <div className="py-14 text-center text-lg font-semibold text-foreground animate-pulse">
          Curating the best products for you!
        </div>
      )
    }
    return <div className="py-10 text-center text-sm text-foreground/70">No products available.</div>
  }

  const cardWidthClass = "w-full"
  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(230px,300px))] gap-x-8 gap-y-10 justify-center"
    >
      {displayProducts.map((product) => {
        const startingPrice =
          product.productType === "hamper" && typeof product.hamperPrice === "number" && Number.isFinite(product.hamperPrice)
            ? product.hamperPrice
            : (() => {
                const minPrice = product.variants.reduce(
                  (currentMin, variant) => Math.min(currentMin, variant.price),
                  Number.POSITIVE_INFINITY,
                )
                return Number.isFinite(minPrice) ? minPrice : 0
              })()

        return (
          <div
            key={product._id}
            className={`border border-[#EED9C4] p-4 hover:shadow-lg transition-shadow bg-white ${cardWidthClass}`}
          >
            <Link href={`/product/${product._id}`} className="block">
              <div className="relative aspect-square overflow-hidden mb-3 cursor-pointer">
                <Image
                  src={product.primaryImage || product.imageUrls?.[0] || "/placeholder.svg"}
                  alt={product.productTitle}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </Link>
            <h3 className="text-base font-semibold text-foreground mb-2 text-center">{product.productTitle}</h3>
            <div className="text-sm font-medium text-foreground mb-3 text-center">
              Starting at {"\u20B9"}
              {startingPrice.toLocaleString("en-IN")}
            </div>
            <Link href={`/product/${product._id}`}>
              <Button className="w-full bg-[#EED9C4] hover:bg-[#D9BB9B] text-foreground py-2.5 text-sm">
                Customize
              </Button>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

