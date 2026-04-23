export type ProductType = "single" | "hamper"

export interface ProductVariant {
  id: string
  weight: string // in kg
  length: string // in cm
  width: string // in cm
  height: string // in cm
  fabric: string // fabric type/id
  price: string
  stock: string
  imageUrls?: string[]
  imageFiles?: File[]
  imagePreviews?: string[]
  imageKeys?: string[]
}

export interface ProductDetailSectionInput {
  id: string
  title: string
  body: string
  imageUrl: string
  imageAlt: string
  imagePosition: "left" | "right"
  imageFile?: File | null
  imagePreview?: string
  imageKey?: string
}

export interface HamperItemInput {
  id: string
  name: string
  imageUrls: string[]
  imageFiles?: File[]
  imagePreviews?: string[]
  imageKeys?: string[]
  variants?: HamperItemVariantInput[]
}

export interface HamperItemVariantInput {
  id: string
  weight: string
  length: string
  width: string
  height: string
  fabric: string
  stock: string
  imageUrls?: string[]
  imageFiles?: File[]
  imagePreviews?: string[]
  imageKeys?: string[]
}

export interface ProductFormData {
  productType: ProductType
  productTitle: string
  description: string
  units: string
  sellerName: string
  sellerEmail: string
  location: string
  category: string
  subCategory: string
  productRole?: "normal" | "complementary"
  hamperPrice?: string
  hamperFabric?: string
  hamperFabricOptions?: string[]
  variants: ProductVariant[]
  detailSections: ProductDetailSectionInput[]
  hamperItems: HamperItemInput[]
}

export interface ProductWithVariants {
  id: number
  productType?: ProductType
  name: string
  category: string
  status: "visible" | "hidden"
  image: string
  description: string
  units: string
  sellerName: string
  sellerEmail: string
  location: string
  subCategory?: string
  variants: ProductVariant[]
  detailSections?: Omit<ProductDetailSectionInput, "id">[]
  hamperItems?: Array<
    Omit<HamperItemInput, "id" | "imageFile" | "imagePreview" | "imageKey"> & {
      variants?: Omit<HamperItemVariantInput, "id">[]
    }
  >
}
