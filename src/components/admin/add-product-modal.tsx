"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Upload, Plus, Trash2, AlertCircle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type {
  ProductFormData,
  ProductVariant,
  ProductDetailSectionInput,
  HamperItemInput,
  HamperItemVariantInput,
} from "@/types/product"
import { fabricOptions } from "@/data/fabric"
import { toast } from "@/hooks/use-toast"
import { FabricSelector } from "@/components/admin/fabric-selector"

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded?: () => void
  mode?: "create" | "edit"
  productToEdit?: EditableProduct | null
}

interface ProductImage {
  id: string
  file?: File
  preview: string
  existingUrl?: string
}

interface EditableProduct {
  _id: string
  productType?: "single" | "hamper"
  productTitle: string
  description: string
  units: string
  sellerName: string
  sellerEmail: string
  location: string
  category: string
  subCategory?: string
  productRole?: "normal" | "complementary"
  imageUrls: string[]
  hamperPrice?: number
  hamperFabric?: string
  hamperFabricOptions?: string[]
  variants: Array<{
    variantId?: string
    weight: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    length?: number
    width?: number
    height?: number
    fabric?: string
    price: number
    stock: number
    imageUrls?: string[]
  }>
  colorOptions?: Array<{
    fabric: string
    imageUrls: string[]
  }>
  detailSections?: Array<{
    title?: string
    body?: string
    imageUrl?: string
    imageAlt?: string
    imagePosition?: "left" | "right"
  }>
  hamperItems?: Array<{
    name?: string
    imageUrls?: string[]
    variants?: Array<{
      weight?: number
      length?: number
      width?: number
      height?: number
      fabric?: string
      price?: number
      stock?: number
    }>
  }>
}

const createEmptyFormData = (): ProductFormData => ({
    productType: "single",
    productTitle: "",
    description: "",
    units: "",
    sellerName: "",
    sellerEmail: "",
    location: "",
    category: "",
    subCategory: "", // Will be removed from form, kept for backward compatibility
    productRole: "normal",
    hamperPrice: "",
    hamperFabric: "",
    hamperFabricOptions: [],
    variants: [
      {
        id: crypto.randomUUID(),
        weight: "",
        length: "",
        width: "",
        height: "",
        fabric: "",
        price: "",
        stock: "",
        imageUrls: [],
        imageFiles: [],
        imagePreviews: [],
      },
    ],
    detailSections: [],
    hamperItems: [],
  })

export default function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
  mode = "create",
  productToEdit = null,
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(createEmptyFormData())

  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isEditMode = mode === "edit" && !!productToEdit

  const getVariantImageCount = (variant: ProductVariant) =>
    (variant.imageUrls?.length || 0) + (variant.imageFiles?.length || 0)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ProductImage[] = []
    const maxImages = formData.productType === "hamper" ? 1 : 6

    Array.from(files).forEach((file) => {
      // Check if we've reached the max limit
      if (productImages.length + newImages.length >= maxImages) {
        alert(`Maximum ${maxImages} image${maxImages === 1 ? "" : "s"} allowed`)
        return
      }

      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} size exceeds 25 MB`)
        return
      }
      newImages.push({ id: crypto.randomUUID(), preview: "" })

      const reader = new FileReader()
      reader.onloadend = () => {
        const newImage: ProductImage = {
          id: crypto.randomUUID(),
          file,
          preview: reader.result as string,
        }
        setProductImages((prev) => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ""
  }

  const handleRemoveImage = (imageId: string) => {
    setProductImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addHamperFabricOption = () => {
    const option = (formData.hamperFabric || "").trim()
    if (!option) return
    setFormData((prev) => ({
      ...prev,
      hamperFabricOptions: Array.from(new Set([...(prev.hamperFabricOptions || []), option])),
    }))
  }

  const removeHamperFabricOption = (optionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      hamperFabricOptions: (prev.hamperFabricOptions || []).filter((option) => option !== optionToRemove),
      hamperFabric:
        prev.hamperFabric === optionToRemove ? (prev.hamperFabricOptions || []).find((option) => option !== optionToRemove) || "" : prev.hamperFabric,
    }))
  }

  const handleVariantChange = (variantId: string, field: keyof ProductVariant, value: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => (variant.id === variantId ? { ...variant, [field]: value } : variant)),
    }))
  }

  const handleVariantImageChange = (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const nextFiles = Array.from(files).filter((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} size exceeds 25 MB`)
        return false
      }
      return true
    })

    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant
        const existingFiles = variant.imageFiles || []
        const existingPreviews = variant.imagePreviews || []
        const existingUrls = variant.imageUrls || []
        const availableSlots = Math.max(0, 6 - (existingFiles.length + existingUrls.length))
        const filesToAdd = nextFiles.slice(0, availableSlots)
        const previewsToAdd = filesToAdd.map((file) => URL.createObjectURL(file))
        return {
          ...variant,
          imageFiles: [...existingFiles, ...filesToAdd],
          imagePreviews: [...existingPreviews, ...previewsToAdd],
        }
      }),
    }))

    e.target.value = ""
  }

  const handleDetailSectionChange = (
    sectionId: string,
    field: keyof ProductDetailSectionInput,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      detailSections: prev.detailSections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    }))
  }

  const handleDetailSectionImageChange = (sectionId: string, file: File | null) => {
    if (file && file.size > 25 * 1024 * 1024) {
      alert(`File ${file.name} size exceeds 25 MB`)
      return
    }
    setFormData((prev) => ({
      ...prev,
      detailSections: prev.detailSections.map((section) => {
        if (section.id !== sectionId) return section
        if (section.imageFile && section.imagePreview) {
          URL.revokeObjectURL(section.imagePreview)
        }
        return {
          ...section,
          imageFile: file,
          imagePreview: file ? URL.createObjectURL(file) : "",
        }
      }),
    }))
  }

  const handleHamperItemChange = (itemId: string, field: keyof HamperItemInput, value: string) => {
    setFormData((prev) => ({
      ...prev,
      hamperItems: prev.hamperItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }))
  }

  const handleHamperItemVariantChange = (
    itemId: string,
    variantId: string,
    field: keyof HamperItemVariantInput,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      hamperItems: prev.hamperItems.map((item) => {
        if (item.id !== itemId) return item
        const nextVariants = (item.variants || []).map((variant) =>
          variant.id === variantId ? { ...variant, [field]: value } : variant,
        )
        return { ...item, variants: nextVariants }
      }),
    }))
  }

  const handleHamperItemImageChange = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const nextFiles = Array.from(files).filter((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} size exceeds 25 MB`)
        return false
      }
      return true
    })

    setFormData((prev) => ({
      ...prev,
      hamperItems: prev.hamperItems.map((item) => {
        if (item.id !== itemId) return item
        const existingFiles = item.imageFiles || []
        const existingPreviews = item.imagePreviews || []
        const existingUrls = item.imageUrls || []
        const availableSlots = Math.max(0, 6 - (existingFiles.length + existingUrls.length))
        const filesToAdd = nextFiles.slice(0, availableSlots)
        const previewsToAdd = filesToAdd.map((file) => URL.createObjectURL(file))

        return {
          ...item,
          imageFiles: [...existingFiles, ...filesToAdd],
          imagePreviews: [...existingPreviews, ...previewsToAdd],
        }
      }),
    }))

    // Reset input so picking the same file again triggers onChange
    e.target.value = ""
  }

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: crypto.randomUUID(),
          weight: "",
          length: "",
          width: "",
          height: "",
          fabric: "",
          price: "",
          stock: "",
          imageUrls: [],
          imageFiles: [],
          imagePreviews: [],
        },
      ],
    }))
  }

  const addDetailSection = () => {
    setFormData((prev) => ({
      ...prev,
      detailSections: [
        ...prev.detailSections,
        {
          id: crypto.randomUUID(),
          title: "",
          body: "",
          imageUrl: "",
          imageAlt: "",
          imagePosition: "right",
          imageFile: null,
          imagePreview: "",
        },
      ],
    }))
  }

  const addHamperItem = () => {
    setFormData((prev) => ({
      ...prev,
      hamperItems: [
        ...prev.hamperItems,
        {
          id: crypto.randomUUID(),
          name: "",
          imageUrls: [],
          imageFiles: [],
          imagePreviews: [],
          variants: [
            {
              id: crypto.randomUUID(),
              weight: "",
              length: "",
              width: "",
              height: "",
              stock: "",
            },
          ],
        },
      ],
    }))
  }

  const addHamperItemVariant = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      hamperItems: prev.hamperItems.map((item) => {
        if (item.id !== itemId) return item
        const nextVariants = [
          ...(item.variants || []),
          {
            id: crypto.randomUUID(),
            weight: "",
            length: "",
            width: "",
            height: "",
            stock: "",
          },
        ]
        return { ...item, variants: nextVariants }
      }),
    }))
  }

  const removeHamperItemVariant = (itemId: string, variantId: string) => {
    setFormData((prev) => ({
      ...prev,
      hamperItems: prev.hamperItems.map((item) => {
        if (item.id !== itemId) return item
        if ((item.variants || []).length <= 1) {
          alert("At least one variant is required for each hamper item")
          return item
        }
        const nextVariants = (item.variants || []).filter((variant) => variant.id !== variantId)
        return { ...item, variants: nextVariants }
      }),
    }))
  }

  const removeVariant = (variantId: string) => {
    if (formData.variants.length === 1) {
      alert("At least one variant is required")
      return
    }
    const variantToRemove = formData.variants.find((variant) => variant.id === variantId)
    ;(variantToRemove?.imagePreviews || []).forEach((preview) => URL.revokeObjectURL(preview))
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((variant) => variant.id !== variantId),
    }))
  }

  const removeDetailSection = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      detailSections: prev.detailSections.filter((section) => {
        if (section.id === sectionId && section.imageFile && section.imagePreview) {
          URL.revokeObjectURL(section.imagePreview)
        }
        return section.id !== sectionId
      }),
    }))
  }

  const removeHamperItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      hamperItems: prev.hamperItems.filter((item) => {
        if (item.id === itemId && item.imagePreviews) {
          item.imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
        }
        return item.id !== itemId
      }),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    if (formData.productType === "hamper" && formData.hamperItems.length === 0) {
      setSubmitError("Please add at least one hamper item")
      setIsSubmitting(false)
      return
    }

    if (formData.productType === "hamper" && (formData.hamperFabricOptions || []).length === 0) {
      setSubmitError("Please add at least one hamper fabric option")
      setIsSubmitting(false)
      return
    }

    if (formData.productType === "single") {
      const hasAllVariantFabrics = formData.variants.every((variant) => !!variant.fabric?.trim())
      if (!hasAllVariantFabrics) {
        setSubmitError("Please select fabric for all variants before uploading images")
        setIsSubmitting(false)
        return
      }
      const uniqueFabrics = Array.from(new Set(formData.variants.map((variant) => variant.fabric.trim()).filter(Boolean)))
      const missingFabric = uniqueFabrics.find((fabric) => {
        const representative = formData.variants.find((variant) => variant.fabric.trim() === fabric)
        return !representative || getVariantImageCount(representative) === 0
      })
      if (missingFabric) {
        setSubmitError(`Please upload at least one image for fabric "${missingFabric}"`)
        setIsSubmitting(false)
        return
      }
    }

    if (
      formData.productType === "single" &&
      formData.variants.some((variant) => !variant.fabric?.trim())
    ) {
      setSubmitError("Please select fabric for all variants")
      setIsSubmitting(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      const cleanedDetailSections = formData.detailSections
        .map((section) => {
          const imageKey = section.imageFile ? `detailSectionImage_${section.id}` : ""
          return {
            title: section.title.trim(),
            body: section.body.trim(),
            imageUrl: section.imageFile ? "" : section.imageUrl.trim(),
            imageAlt: section.imageAlt.trim(),
            imagePosition: section.imagePosition,
            imageKey,
          }
        })
        .filter((section) => section.title || section.body || section.imageUrl || section.imageKey)

      const cleanedHamperItems = formData.hamperItems
        .map((item) => {
          const imageKeys = (item.imageFiles || []).map((_, index) => `hamperItemImage_${item.id}_${index}`)
          return {
            name: item.name.trim(),
            imageUrls: item.imageUrls || [],
            imageKeys,
            variants: (item.variants || []).map((variant) => ({
              weight: variant.weight,
              length: variant.length,
              width: variant.width,
              height: variant.height,
              stock: variant.stock,
            })),
          }
        })
        .filter(
          (item) =>
            item.name ||
            (item.imageUrls && item.imageUrls.length > 0) ||
            (item.imageKeys && item.imageKeys.length > 0) ||
            (item.variants && item.variants.length > 0),
        )

      const cleanedVariants =
        formData.productType === "hamper"
          ? []
          : formData.variants.map((variant) => {
              const imageKeys = (variant.imageFiles || []).map((_, index) => `variantImage_${variant.id}_${index}`)
              return {
                id: variant.id,
                weight: variant.weight,
                length: variant.length,
                width: variant.width,
                height: variant.height,
                fabric: variant.fabric,
                price: variant.price,
                stock: variant.stock,
                imageUrls: variant.imageUrls || [],
                imageKeys,
              }
            })

      formDataToSend.append("productType", formData.productType)
      formDataToSend.append("productRole", formData.productRole || "normal")
      formDataToSend.append("productTitle", formData.productTitle)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("units", formData.units)
      formDataToSend.append("sellerName", formData.sellerName)
      formDataToSend.append("sellerEmail", formData.sellerEmail)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("subCategory", formData.subCategory)
      if (formData.productType === "hamper") {
        formDataToSend.append("hamperPrice", String(formData.hamperPrice || ""))
        formDataToSend.append("hamperFabric", String(formData.hamperFabric || formData.hamperFabricOptions?.[0] || ""))
        formDataToSend.append("hamperFabricOptions", JSON.stringify(formData.hamperFabricOptions || []))
      }
      formDataToSend.append("detailSections", JSON.stringify(cleanedDetailSections))
      formDataToSend.append("hamperItems", JSON.stringify(cleanedHamperItems))
      const existingImageUrls = productImages
        .map((img) => img.existingUrl)
        .filter((url): url is string => typeof url === "string" && !!url.trim())
      formDataToSend.append("existingImageUrls", JSON.stringify(existingImageUrls))
      formData.detailSections.forEach((section) => {
        if (section.imageFile) {
          const imageKey = `detailSectionImage_${section.id}`
          formDataToSend.append(imageKey, section.imageFile)
        }
      })

      formData.hamperItems.forEach((item) => {
        if (!item.imageFiles || item.imageFiles.length === 0) return
        item.imageFiles.forEach((file, index) => {
          const imageKey = `hamperItemImage_${item.id}_${index}`
          formDataToSend.append(imageKey, file)
        })
      })

      formData.variants.forEach((variant) => {
        if (!variant.imageFiles || variant.imageFiles.length === 0) return
        variant.imageFiles.forEach((file, index) => {
          const imageKey = `variantImage_${variant.id}_${index}`
          formDataToSend.append(imageKey, file)
        })
      })

      formDataToSend.append("variants", JSON.stringify(cleanedVariants))

      // For hampers, we use a single cover image (image_0). For singles, up to 6 images (image_0..image_5).
      productImages.forEach((image, index) => {
        if (!image.file) return
        if (formData.productType === "hamper" && index > 0) return
        formDataToSend.append(`image_${index}`, image.file)
      })

      console.log(
        "[v0] Submitting product with",
        productImages.length,
        "images and",
        formData.variants.length,
        "variants",
      )

      const endpoint = isEditMode ? `/api/products/${productToEdit._id}` : "/api/products"
      const response = await fetch(endpoint, {
        method: isEditMode ? "PUT" : "POST",
        body: formDataToSend,
      })

      const contentType = response.headers.get("content-type") ?? ""
      let data: any = null
      if (contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch {
          data = null
        }
      } else {
        const text = await response.text().catch(() => "")
        data = text ? { message: text } : null
      }

      if (!response.ok) {
        throw new Error(data?.message || (isEditMode ? "Failed to update product" : "Failed to create product"))
      }

      console.log(`[v0] Product ${isEditMode ? "updated" : "created"} successfully:`, data)
      toast({
        title: "Success",
        description: isEditMode ? "Product updated successfully." : "Product added successfully.",
      })

      if (onProductAdded) {
        onProductAdded()
      }

      handleCancel()
    } catch (error: any) {
      console.error(`[v0] Error ${isEditMode ? "updating" : "creating"} product:`, error)
      setSubmitError(error.message || `Failed to ${isEditMode ? "update" : "create"} product. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    formData.detailSections.forEach((section) => {
      if (section.imageFile && section.imagePreview) {
        URL.revokeObjectURL(section.imagePreview)
      }
    })
    formData.hamperItems.forEach((item) => {
      if (item.imagePreviews && item.imagePreviews.length > 0) {
        item.imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
      }
    })
    formData.variants.forEach((variant) => {
      if (variant.imagePreviews && variant.imagePreviews.length > 0) {
        variant.imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
      }
    })
    productImages.forEach((image) => {
      if (image.file && image.preview) {
        URL.revokeObjectURL(image.preview)
      }
    })
    setFormData(createEmptyFormData())
    setProductImages([])
    setSubmitError(null)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return

    if (!isEditMode || !productToEdit) {
      setFormData(createEmptyFormData())
      setProductImages([])
      setSubmitError(null)
      return
    }

    const colorOptionByFabric = new Map(
      (productToEdit.colorOptions || []).map((option) => [option.fabric, option.imageUrls || []]),
    )

    const mappedVariants = (productToEdit.variants || []).map((variant) => {
      const length = variant.dimensions?.length ?? variant.length ?? 0
      const width = variant.dimensions?.width ?? variant.width ?? 0
      const height = variant.dimensions?.height ?? variant.height ?? 0
      const fabricId = variant.fabric || ""
      return {
        id: variant.variantId || crypto.randomUUID(),
        weight: String(variant.weight ?? ""),
        length: String(length || ""),
        width: String(width || ""),
        height: String(height || ""),
        fabric: fabricId,
        price: String(variant.price ?? ""),
        stock: String(variant.stock ?? ""),
        imageUrls: variant.imageUrls?.length ? variant.imageUrls : colorOptionByFabric.get(fabricId) || [],
        imageFiles: [],
        imagePreviews: [],
      }
    })

    setFormData({
      productType: productToEdit.productType === "hamper" ? "hamper" : "single",
      productTitle: productToEdit.productTitle || "",
      description: productToEdit.description || "",
      units: productToEdit.units || "",
      sellerName: productToEdit.sellerName || "",
      sellerEmail: productToEdit.sellerEmail || "",
      location: productToEdit.location || "",
      category: productToEdit.category || "",
      subCategory: productToEdit.subCategory || "",
      productType: productToEdit.productType || "single",
      productRole: productToEdit.productRole || "normal",
      hamperPrice: productToEdit.productType === "hamper" ? String(productToEdit.hamperPrice ?? "") : "",
      hamperFabric: productToEdit.productType === "hamper" ? String(productToEdit.hamperFabric ?? "") : "",
      hamperFabricOptions:
        productToEdit.productType === "hamper"
          ? Array.from(
              new Set(
                [
                  ...(productToEdit.hamperFabricOptions || []),
                  ...(productToEdit.hamperFabric ? [productToEdit.hamperFabric] : []),
                ].filter((option) => typeof option === "string" && !!option.trim()),
              ),
            )
          : [],
      variants:
        mappedVariants.length > 0
          ? mappedVariants
          : [
              {
                id: crypto.randomUUID(),
                weight: "",
                length: "",
                width: "",
                height: "",
                fabric: "",
                price: "",
                stock: "",
                imageUrls: [],
                imageFiles: [],
                imagePreviews: [],
              },
            ],
      detailSections: (productToEdit.detailSections || []).map((section) => ({
        id: crypto.randomUUID(),
        title: section.title || "",
        body: section.body || "",
        imageUrl: section.imageUrl || "",
        imageAlt: section.imageAlt || "",
        imagePosition: section.imagePosition === "left" ? "left" : "right",
        imageFile: null,
        imagePreview: section.imageUrl || "",
      })),
      hamperItems: (productToEdit.hamperItems || []).map((item) => ({
        id: crypto.randomUUID(),
        name: item.name || "",
        imageUrls: item.imageUrls || [],
        imageFiles: [],
        imagePreviews: [],
        variants: (item.variants || []).map((variant) => ({
          id: crypto.randomUUID(),
          weight: String(variant.weight ?? ""),
          length: String(variant.length ?? ""),
          width: String(variant.width ?? ""),
          height: String(variant.height ?? ""),
          stock: String(variant.stock ?? ""),
        })),
      })),
    })

    setProductImages(
      (productToEdit.imageUrls || []).map((url) => ({
        id: crypto.randomUUID(),
        preview: url,
        existingUrl: url,
      })),
    )
    setSubmitError(null)
  }, [isOpen, isEditMode, productToEdit])

  useEffect(() => {
    if (formData.productType !== "hamper") return
    // Keep a single cover image for hampers (if any); remove extras.
    if (productImages.length <= 1) return
    setProductImages((prev) => prev.slice(0, 1))
  }, [formData.productType, productImages.length])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
    >
      <DialogContent className="max-w-[95vw] w-full lg:max-w-7xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 md:p-8 font-roboto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-[#6D4530]">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-[#8B5A3C]/70">
            Fill in the product details and add variants with different dimensions, weights, fabrics, and pricing
          </p>
        </DialogHeader>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-900">
            <strong>Important!</strong> Please verify the seller detail address that you used in your profile
            management. (Products are linked to your seller account through the email)
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 font-roboto">
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-red-900">{submitError}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Basic Information */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-base sm:text-lg font-semibold text-[#6D4530] border-b border-[#D9CFC7] pb-2">
                Basic Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="productTitle" className="text-sm sm:text-base text-[#6D4530]">
                  Product Title*
                </Label>
                <Input
                  id="productTitle"
                  placeholder="Enter product title"
                  value={formData.productTitle}
                  onChange={(e) => handleInputChange("productTitle", e.target.value)}
                  className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base text-[#6D4530]">
                  Product Description*
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="pl-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3 min-h-[140px] sm:min-h-[160px]"
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="units" className="text-sm sm:text-base text-[#6D4530]">
                  Units*
                </Label>
                <Input
                  id="units"
                  placeholder="e.g., Kg, box, piece, meter"
                  value={formData.units}
                  onChange={(e) => handleInputChange("units", e.target.value)}
                  className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productRole" className="text-sm sm:text-base text-[#6D4530]">
                  Product Role*
                </Label>
                <Select value={formData.productRole} onValueChange={(value) => handleInputChange("productRole", value)}>
                  <SelectTrigger
                    id="productRole"
                    className="h-12 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold"
                  >
                    <SelectValue placeholder="Select product role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      <span className="font-medium">Normal Product</span>
                      <p className="text-xs text-gray-600">Customers purchase this product</p>
                    </SelectItem>
                    <SelectItem value="complementary">
                      <span className="font-medium">Complementary Product</span>
                      <p className="text-xs text-gray-600">Can be offered free with other products</p>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#8B5A3C]/60 mt-1">
                  {formData.productRole === "complementary"
                    ? "This product can be added as a free gift to other products"
                    : "This product will be sold individually"}
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-base sm:text-lg font-semibold text-[#6D4530] border-b border-[#D9CFC7] pb-2">
                Product Configuration
              </h3>

              <div className="space-y-2">
                <Label htmlFor="productType" className="text-sm sm:text-base text-[#6D4530]">
                  Product Type*
                </Label>
                <Select value={formData.productType} onValueChange={(value) => handleInputChange("productType", value)}>
                  <SelectTrigger id="productType" className="border-[#D9CFC7] h-11 sm:h-12">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="hamper">Hamper (Bundle)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.productType === "hamper" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hamperPrice" className="text-sm sm:text-base text-[#6D4530]">
                      Hamper Price (₹)*
                    </Label>
                    <Input
                      id="hamperPrice"
                      type="number"
                      step="0.01"
                      placeholder="Enter total hamper price"
                      value={formData.hamperPrice || ""}
                      onChange={(e) => handleInputChange("hamperPrice", e.target.value)}
                      className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                      required
                    />
                  </div>

                  <FabricSelector
                    value={formData.hamperFabric || ""}
                    onValueChange={(value) => handleInputChange("hamperFabric", value)}
                    label="Hamper Fabric Picker"
                    htmlFor="hamperFabric"
                    triggerClassName="border-[#D9CFC7] h-11 sm:h-12"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={addHamperFabricOption}
                      className="bg-[#6D4530] hover:bg-[#8B5A3C] text-white"
                    >
                      Add Fabric Option
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.hamperFabricOptions || []).map((option) => (
                      <span
                        key={option}
                        className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC7] bg-white px-3 py-1 text-sm text-[#6D4530]"
                      >
                        {fabricOptions.find((fabric) => fabric.id === option)?.name || option}
                        <button
                          type="button"
                          onClick={() => removeHamperFabricOption(option)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Remove ${option}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hamper Cover Image */}
            {formData.productType === "hamper" && (
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between border-b border-[#D9CFC7] pb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-[#6D4530]">
                    Hamper Cover Image
                  </h3>
                  <span className="text-xs sm:text-sm text-[#8B5A3C]/70">
                    {productImages.length}/1 images
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {productImages.length < 1 && (
                    <label
                      htmlFor="imageUpload"
                      className="border-2 border-dashed border-[#D9CFC7] rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#8B5A3C] hover:bg-[#F5F1ED]/50 transition-colors"
                    >
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-[#8B5A3C]/50 mb-2" />
                      <p className="text-[10px] sm:text-xs font-medium text-[#8B5A3C] text-center px-1">
                        Click to Upload
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-[#8B5A3C]/70 mt-1">(Max 25 Mb)</p>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        multiple={false}
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}

                  {productImages.map((image) => (
                    <div key={image.id} className="relative aspect-square group">
                      <img
                        src={image.preview || "/placeholder.svg"}
                        alt="Product preview"
                        className="w-full h-full object-cover rounded-lg border border-[#D9CFC7]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 sm:p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                
              </div>
            )}
          </div>

          {/* Detail Sections */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9CFC7] pb-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#6D4530]">Detail Sections</h3>
                <p className="text-xs sm:text-sm text-[#8B5A3C]/70">
                  Add rich sections with headings, paragraphs, and images for the product page.
                </p>
              </div>
              <Button
                type="button"
                onClick={addDetailSection}
                className="bg-[#6D4530] hover:bg-[#8B5A3C] text-white w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>

            {formData.detailSections.length === 0 ? (
              <p className="text-xs sm:text-sm text-[#8B5A3C]/70">
                No detail sections added yet. Use "Add Section" to include custom blocks.
              </p>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {formData.detailSections.map((section, index) => (
                  <div
                    key={section.id}
                    className="border border-[#D9CFC7] rounded-lg p-4 sm:p-5 space-y-4 bg-[#F5F1ED]/30"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-semibold text-[#6D4530]">Section {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDetailSection(section.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`section-title-${section.id}`} className="text-sm text-[#6D4530]">
                          Section Title
                        </Label>
                        <Input
                          id={`section-title-${section.id}`}
                          placeholder="e.g., Exceptional absorbency"
                          value={section.title}
                          onChange={(e) => handleDetailSectionChange(section.id, "title", e.target.value)}
                          className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`section-image-${section.id}`} className="text-sm text-[#6D4530]">
                          Section Image
                        </Label>
                        <Input
                          id={`section-image-${section.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDetailSectionImageChange(section.id, e.target.files?.[0] || null)}
                          className="h-12 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold"
                        />
                        {section.imagePreview && (
                          <img
                            src={section.imagePreview}
                            alt={section.imageAlt || "Section preview"}
                            className="mt-3 w-full max-h-48 object-cover rounded-lg border border-[#D9CFC7]"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`section-alt-${section.id}`} className="text-sm text-[#6D4530]">
                          Image Alt Text
                        </Label>
                        <Input
                          id={`section-alt-${section.id}`}
                          placeholder="Describe the image"
                          value={section.imageAlt}
                          onChange={(e) => handleDetailSectionChange(section.id, "imageAlt", e.target.value)}
                          className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`section-position-${section.id}`} className="text-sm text-[#6D4530]">
                          Image Position
                        </Label>
                        <Select
                          value={section.imagePosition}
                          onValueChange={(value) => handleDetailSectionChange(section.id, "imagePosition", value)}
                        >
                          <SelectTrigger
                            id={`section-position-${section.id}`}
                            className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold"
                          >
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#D9CFC7]">
                            <SelectItem value="left">Image on left</SelectItem>
                            <SelectItem value="right">Image on right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`section-body-${section.id}`} className="text-sm text-[#6D4530]">
                        Paragraph
                      </Label>
                      <Textarea
                        id={`section-body-${section.id}`}
                        placeholder="Enter the paragraph text"
                        value={section.body}
                        onChange={(e) => handleDetailSectionChange(section.id, "body", e.target.value)}
                        className="pl-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold min-h-[120px]"
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hamper Items */}
          {formData.productType === "hamper" && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9CFC7] pb-2">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#6D4530]">Hamper Items</h3>
                  <p className="text-xs sm:text-sm text-[#8B5A3C]/70">Add the items included in this hamper</p>
                </div>
                <Button
                  type="button"
                  onClick={addHamperItem}
                  className="bg-[#6D4530] hover:bg-[#8B5A3C] text-white w-full sm:w-auto"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {formData.hamperItems.length === 0 ? (
                <div className="border border-dashed border-[#D9CFC7] rounded-lg p-6 text-center text-sm text-[#8B5A3C]/70">
                  No hamper items yet. Click "Add Item" to include products in this hamper.
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  {formData.hamperItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="border border-[#D9CFC7] rounded-lg p-4 sm:p-5 space-y-4 bg-[#F5F1ED]/30"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-semibold text-[#6D4530]">Item {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHamperItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`hamper-name-${item.id}`} className="text-sm text-[#6D4530]">
                            Item Name*
                          </Label>
                          <Input
                            id={`hamper-name-${item.id}`}
                            placeholder="e.g., Baby Shampoo"
                            value={item.name}
                            onChange={(e) => handleHamperItemChange(item.id, "name", e.target.value)}
                            className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-[#6D4530]">Variant Options*</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => addHamperItemVariant(item.id)}
                            className="text-[#6D4530] hover:bg-[#F5F1ED]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Variant
                          </Button>
                        </div>

                        {(item.variants || []).length === 0 ? (
                          <div className="border border-dashed border-[#D9CFC7] rounded-lg p-4 text-center text-xs text-[#8B5A3C]/70">
                            Add at least one variant option for this hamper item.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(item.variants || []).map((variant, variantIndex) => (
                              <div
                                key={variant.id}
                                className="border border-[#D9CFC7] rounded-lg p-3 bg-white space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-[#6D4530]">
                                    Variant {variantIndex + 1}
                                  </p>
                                  {(item.variants || []).length > 1 && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeHamperItemVariant(item.id, variant.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`hamper-variant-weight-${variant.id}`}
                                      className="text-xs text-[#6D4530]"
                                    >
                                      Weight (kg)*
                                    </Label>
                                    <Input
                                      id={`hamper-variant-weight-${variant.id}`}
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g., 2.5"
                                      value={variant.weight}
                                      onChange={(e) =>
                                        handleHamperItemVariantChange(item.id, variant.id, "weight", e.target.value)
                                      }
                                      className="h-10 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-sm font-semibold"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`hamper-variant-length-${variant.id}`}
                                      className="text-xs text-[#6D4530]"
                                    >
                                      Length (cm)*
                                    </Label>
                                    <Input
                                      id={`hamper-variant-length-${variant.id}`}
                                      type="number"
                                      step="0.1"
                                      value={variant.length}
                                      onChange={(e) =>
                                        handleHamperItemVariantChange(item.id, variant.id, "length", e.target.value)
                                      }
                                      className="h-10 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-sm font-semibold"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`hamper-variant-width-${variant.id}`}
                                      className="text-xs text-[#6D4530]"
                                    >
                                      Width (cm)*
                                    </Label>
                                    <Input
                                      id={`hamper-variant-width-${variant.id}`}
                                      type="number"
                                      step="0.1"
                                      value={variant.width}
                                      onChange={(e) =>
                                        handleHamperItemVariantChange(item.id, variant.id, "width", e.target.value)
                                      }
                                      className="h-10 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-sm font-semibold"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`hamper-variant-height-${variant.id}`}
                                      className="text-xs text-[#6D4530]"
                                    >
                                      Height (cm)*
                                    </Label>
                                    <Input
                                      id={`hamper-variant-height-${variant.id}`}
                                      type="number"
                                      step="0.1"
                                      value={variant.height}
                                      onChange={(e) =>
                                        handleHamperItemVariantChange(item.id, variant.id, "height", e.target.value)
                                      }
                                      className="h-10 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-sm font-semibold"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    {/* Fabric and price are product-level for hampers */}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`hamper-variant-stock-${variant.id}`}
                                      className="text-xs text-[#6D4530]"
                                    >
                                      Stock*
                                    </Label>
                                    <Input
                                      id={`hamper-variant-stock-${variant.id}`}
                                      type="number"
                                      placeholder="e.g., 50"
                                      value={variant.stock}
                                      onChange={(e) =>
                                        handleHamperItemVariantChange(item.id, variant.id, "stock", e.target.value)
                                      }
                                      className="h-10 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-sm font-semibold"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`hamper-image-${item.id}`} className="text-sm text-[#6D4530]">
                            Item Images*
                          </Label>
                          <span className="text-xs text-[#8B5A3C]/70">
                            {(item.imageUrls?.length || 0) + (item.imageFiles?.length || 0)}/6
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(item.imageFiles?.length || 0) + (item.imageUrls?.length || 0) < 6 && (
                            <label
                              htmlFor={`hamper-image-${item.id}`}
                              className="border-2 border-dashed border-[#D9CFC7] rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#8B5A3C] hover:bg-[#F5F1ED]/50 transition-colors"
                            >
                              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-[#8B5A3C]/50 mb-2" />
                              <p className="text-[10px] sm:text-xs font-medium text-[#8B5A3C] text-center px-1">
                                Click to Upload
                              </p>
                              <p className="text-[9px] sm:text-[10px] text-[#8B5A3C]/70 mt-1">(Max 25 Mb)</p>
                              <input
                                id={`hamper-image-${item.id}`}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleHamperItemImageChange(item.id, e)}
                              />
                            </label>
                          )}

                          {(item.imageUrls || []).map((url, imageIndex) => (
                            <div key={`${item.id}-existing-${imageIndex}`} className="relative aspect-square group">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={item.name || "Hamper item"}
                                className="w-full h-full object-cover rounded-lg border border-[#D9CFC7]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    hamperItems: prev.hamperItems.map((entry) => {
                                      if (entry.id !== item.id) return entry
                                      const nextUrls = (entry.imageUrls || []).filter((_, idx) => idx !== imageIndex)
                                      return { ...entry, imageUrls: nextUrls }
                                    }),
                                  }))
                                }
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          {(item.imagePreviews || []).map((preview, imageIndex) => (
                            <div key={`${item.id}-preview-${imageIndex}`} className="relative aspect-square group">
                              <img
                                src={preview}
                                alt={item.name || "Hamper item"}
                                className="w-full h-full object-cover rounded-lg border border-[#D9CFC7]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    hamperItems: prev.hamperItems.map((entry) => {
                                      if (entry.id !== item.id) return entry
                                      const nextFiles = (entry.imageFiles || []).filter((_, idx) => idx !== imageIndex)
                                      const nextPreviews = (entry.imagePreviews || []).filter((_, idx) => idx !== imageIndex)
                                      if (entry.imagePreviews?.[imageIndex]) {
                                        URL.revokeObjectURL(entry.imagePreviews[imageIndex]!)
                                      }
                                      return { ...entry, imageFiles: nextFiles, imagePreviews: nextPreviews }
                                    }),
                                  }))
                                }
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Variants */}
          {formData.productType === "single" && (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9CFC7] pb-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#6D4530]">Product Variants</h3>
                <p className="text-xs sm:text-sm text-[#8B5A3C]/70">Add different sizes/weights with custom pricing</p>
              </div>
              <Button
                type="button"
                onClick={addVariant}
                className="bg-[#6D4530] hover:bg-[#8B5A3C] text-white w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              {formData.variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="border border-[#D9CFC7] rounded-lg p-4 sm:p-5 space-y-4 bg-[#F5F1ED]/30"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-semibold text-[#6D4530]">Variant {index + 1}</h4>
                    {formData.variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(variant.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`weight-${variant.id}`} className="text-sm text-[#6D4530]">
                        Weight (kg)*
                      </Label>
                      <Input
                        id={`weight-${variant.id}`}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 2.5"
                        value={variant.weight}
                        onChange={(e) => handleVariantChange(variant.id, "weight", e.target.value)}
                        className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`length-${variant.id}`} className="text-sm text-[#6D4530]">
                        Length (cm)*
                      </Label>
                      <Input
                        id={`length-${variant.id}`}
                        type="number"
                        step="0.1"
                        placeholder="e.g., 30"
                        value={variant.length}
                        onChange={(e) => handleVariantChange(variant.id, "length", e.target.value)}
                        className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`width-${variant.id}`} className="text-sm text-[#6D4530]">
                        Width (cm)*
                      </Label>
                      <Input
                        id={`width-${variant.id}`}
                        type="number"
                        step="0.1"
                        placeholder="e.g., 20"
                        value={variant.width}
                        onChange={(e) => handleVariantChange(variant.id, "width", e.target.value)}
                        className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`height-${variant.id}`} className="text-sm text-[#6D4530]">
                        Height (cm)*
                      </Label>
                      <Input
                        id={`height-${variant.id}`}
                        type="number"
                        step="0.1"
                        placeholder="e.g., 15"
                        value={variant.height}
                        onChange={(e) => handleVariantChange(variant.id, "height", e.target.value)}
                        className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                        required
                      />
                    </div>

                    <div className="space-y-2 mb-3">
                      <FabricSelector
                        value={variant.fabric}
                        onValueChange={(value) => handleVariantChange(variant.id, "fabric", value)}
                        label="Fabric"
                        htmlFor={`fabric-${variant.id}`}
                        triggerClassName="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`price-${variant.id}`} className="text-sm text-[#6D4530]">
                        Price (₹)*
                      </Label>
                      <Input
                        id={`price-${variant.id}`}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1200"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(variant.id, "price", e.target.value)}
                        className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`stock-${variant.id}`} className="text-sm text-[#6D4530]">
                        Stock*
                      </Label>
                      <Input
                        id={`stock-${variant.id}`}
                        type="number"
                        placeholder="e.g., 50"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(variant.id, "stock", e.target.value)}
                        className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`variant-image-${variant.id}`} className="text-sm text-[#6D4530]">
                        Variant Images*
                      </Label>
                      <span className="text-xs text-[#8B5A3C]/70">{getVariantImageCount(variant)}/6</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getVariantImageCount(variant) < 6 && (
                        <label
                          htmlFor={`variant-image-${variant.id}`}
                          className="border-2 border-dashed border-[#D9CFC7] rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#8B5A3C] hover:bg-[#F5F1ED]/50 transition-colors"
                        >
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-[#8B5A3C]/50 mb-2" />
                          <p className="text-[10px] sm:text-xs font-medium text-[#8B5A3C] text-center px-1">Click to Upload</p>
                          <p className="text-[9px] sm:text-[10px] text-[#8B5A3C]/70 mt-1">(Max 25 Mb)</p>
                          <input
                            id={`variant-image-${variant.id}`}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleVariantImageChange(variant.id, e)}
                          />
                        </label>
                      )}

                      {(variant.imageUrls || []).map((url, imageIndex) => (
                        <div key={`${variant.id}-existing-${imageIndex}`} className="relative aspect-square group">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Variant ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-[#D9CFC7]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                variants: prev.variants.map((entry) => {
                                  if (entry.id !== variant.id) return entry
                                  const nextUrls = (entry.imageUrls || []).filter((_, idx) => idx !== imageIndex)
                                  return { ...entry, imageUrls: nextUrls }
                                }),
                              }))
                            }
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {(variant.imagePreviews || []).map((preview, imageIndex) => (
                        <div key={`${variant.id}-preview-${imageIndex}`} className="relative aspect-square group">
                          <img
                            src={preview}
                            alt={`Variant ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-[#D9CFC7]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                variants: prev.variants.map((entry) => {
                                  if (entry.id !== variant.id) return entry
                                  const nextFiles = (entry.imageFiles || []).filter((_, idx) => idx !== imageIndex)
                                  const nextPreviews = (entry.imagePreviews || []).filter((_, idx) => idx !== imageIndex)
                                  if (entry.imagePreviews?.[imageIndex]) {
                                    URL.revokeObjectURL(entry.imagePreviews[imageIndex]!)
                                  }
                                  return { ...entry, imageFiles: nextFiles, imagePreviews: nextPreviews }
                                }),
                              }))
                            }
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 text-xs sm:text-sm text-[#6D4530] border border-[#D9CFC7]">
                    <strong>Summary:</strong>{" "}
                    {variant.fabric && variant.weight && variant.length && variant.width && variant.height
                      ? `${fabricOptions.find((fabric) => fabric.id === variant.fabric)?.name || variant.fabric} · ${variant.weight}kg · ${variant.length}×${variant.width}×${variant.height}cm`
                      : "Fill dimensions and fabric"}{" "}
                    {variant.price ? `· ₹${variant.price}` : ""}
                    {variant.stock ? ` · ${variant.stock} in stock` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Seller Information */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-base sm:text-lg font-semibold text-[#6D4530] border-b border-[#D9CFC7] pb-2">
              Seller Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName" className="text-sm sm:text-base text-[#6D4530]">
                  Seller Name*
                </Label>
                <Input
                  id="sellerName"
                  placeholder="Enter seller name"
                  value={formData.sellerName}
                  onChange={(e) => handleInputChange("sellerName", e.target.value)}
                  className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerEmail" className="text-sm sm:text-base text-[#6D4530]">
                  Seller Email*
                </Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  placeholder="Enter seller email"
                  value={formData.sellerEmail}
                  onChange={(e) => handleInputChange("sellerEmail", e.target.value)}
                  className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                  required
                />
                <p className="text-xs text-[#8B5A3C]/70">
                  * Please use the same email address that you provided during profile management
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm sm:text-base text-[#6D4530]">
                Location*
              </Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-base sm:text-lg font-semibold text-[#6D4530] border-b border-[#D9CFC7] pb-2">
              Category
            </h3>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm sm:text-base text-[#6D4530]">
                Product Category*
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className="border-[#D9CFC7] h-10 sm:h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joy">joy</SelectItem>
                  <SelectItem value="bliss">Bliss</SelectItem>
                  <SelectItem value="grace">grace</SelectItem>
                  
                  <SelectItem value="mattress">Mattress</SelectItem>
                  <SelectItem value="pillow">Pillow</SelectItem>
                  <SelectItem value="bedding">Bedding</SelectItem>
                  <SelectItem value="bedsheet">Bedsheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[#D9CFC7]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto border-[#D9CFC7] text-[#6D4530] hover:bg-[#8B5A3C]/10 bg-transparent"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 bg-[#6D4530] hover:bg-[#8B5A3C] text-white font-semibold h-11 sm:h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  {isEditMode ? "Updating Product..." : "Creating Product..."}
                </>
              ) : (
                isEditMode ? "Update Product" : "Add Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
