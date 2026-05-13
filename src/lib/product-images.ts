export function getProductListingImage(product: {
  primaryImage?: string
  imageUrls?: string[]
  colorOptions?: Array<{ imageUrls?: string[] }>
}) {
  const colorImage = product.colorOptions?.[0]?.imageUrls?.find(
    (url) => typeof url === "string" && url.trim(),
  )
  if (colorImage) return colorImage

  if (product.primaryImage?.trim()) return product.primaryImage

  const galleryImage = product.imageUrls?.find((url) => typeof url === "string" && url.trim())
  if (galleryImage) return galleryImage

  return "/placeholder.svg"
}
