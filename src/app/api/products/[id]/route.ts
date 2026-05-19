import { NextResponse } from "next/server"
import { del, put } from "@vercel/blob"
import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import mongoose from "mongoose"

export const runtime = "nodejs"

function isFileLike(value: unknown): value is File {
  if (!value || typeof value !== "object") return false
  return typeof (value as any).arrayBuffer === "function"
}

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id)
}

// GET - Fetch single product by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeVariantImages = searchParams.get("includeVariantImages") === "true"

    // Validate if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      )
    }

    await connectDB()

    const projection = includeVariantImages ? {} : { "variants.imageUrls": 0 }
    const product = await Product.findById(id, projection).lean()

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[PRODUCT_FETCH_ERROR]", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch product" }, { status: 500 })
  }
}

// DELETE - Delete product by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] DELETE request received for product:", id)

    // Validate if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      )
    }

    await connectDB()

    const product = await Product.findById(id)

    if (!product) {
      console.log("[v0] Product not found:", id)
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    // Delete associated images from Vercel Blob
    const hamperImageUrls = Array.isArray(product.hamperItems)
      ? product.hamperItems.flatMap((item: any) => [
          ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
          ...((Array.isArray(item.variants) ? item.variants : []).flatMap((variant: any) => variant.imageUrls || [])),
        ])
      : []
    const allImageUrls = [...product.imageUrls, ...hamperImageUrls]
    console.log(`[v0] Deleting ${allImageUrls.length} images from Vercel Blob...`)
    for (const imageUrl of allImageUrls) {
      try {
        await del(imageUrl)
        console.log(`[v0] Deleted image: ${imageUrl}`)
      } catch (deleteError) {
        console.error(`[v0] Error deleting image ${imageUrl}:`, deleteError)
        // Continue deletion even if individual images fail
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(id)

    console.log("[v0] Product deleted successfully:", id)

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[PRODUCT_DELETE_ERROR]", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to delete product" }, { status: 500 })
  }
}

// PATCH - Update product status
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { status } = await request.json()

    if (!status || !["visible", "hidden"].includes(status)) {
      return NextResponse.json({ success: false, message: "Valid status is required" }, { status: 400 })
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      )
    }

    await connectDB()

    const product = await Product.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    console.log("[v0] Product status updated:", { id, status })

    return NextResponse.json(
      {
        success: true,
        message: "Product status updated successfully",
        product,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[PRODUCT_UPDATE_ERROR]", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to update product" }, { status: 500 })
  }
}

// PUT - Update product by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] PUT request received for product:", id)

    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Invalid product ID format" }, { status: 400 })
    }

    const formData = await request.formData()

    const productTypeRaw = (formData.get("productType") as string) ?? "single"
    let productType = productTypeRaw.toLowerCase()
    const productRole = (formData.get("productRole") as string) || "normal"
    const productTitle = (formData.get("productTitle") as string) ?? ""
    const description = (formData.get("description") as string) ?? ""
    const units = (formData.get("units") as string) ?? ""
    const sellerName = (formData.get("sellerName") as string) ?? ""
    const sellerEmail = (formData.get("sellerEmail") as string) ?? ""
    const location = (formData.get("location") as string) ?? ""
    const category = (formData.get("category") as string) ?? ""
    const subCategory = (formData.get("subCategory") as string) ?? ""
    const variantsJson = (formData.get("variants") as string) ?? ""
    const detailSectionsJson = (formData.get("detailSections") as string) ?? ""
    const existingImageUrlsJson = (formData.get("existingImageUrls") as string) ?? "[]"
    const hamperItemsJson = (formData.get("hamperItems") as string) ?? ""
    const hamperPriceRaw = formData.get("hamperPrice") as string | null
    const hamperFabric = (formData.get("hamperFabric") as string | null) ?? ""
    const hamperFabricOptionsJson = (formData.get("hamperFabricOptions") as string | null) ?? "[]"

    if (
      !productTitle ||
      !description ||
      !units ||
      !sellerName ||
      !sellerEmail ||
      !location ||
      !category
    ) {
      const missingFields = []
      if (!productTitle) missingFields.push("productTitle")
      if (!description) missingFields.push("description")
      if (!units) missingFields.push("units")
      if (!sellerName) missingFields.push("sellerName")
      if (!sellerEmail) missingFields.push("sellerEmail")
      if (!location) missingFields.push("location")
      if (!category) missingFields.push("category")

      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      )
    }

    const categoryLower = category.toLowerCase()
    if (
      categoryLower !== "mattress" &&
      categoryLower !== "pillow" &&
      categoryLower !== "bedding" &&
      categoryLower !== "bedsheet" &&
      categoryLower !== "joy" &&
      categoryLower !== "bliss" &&
      categoryLower !== "grace"
    ) {
      return NextResponse.json(
        { success: false, message: "Category must be either joy, bliss, grace, mattress, pillow, bedding, or bedsheet" },
        { status: 400 },
      )
    }

    let variants: Array<{
      id?: string
      weight?: number | string
      length?: number | string
      width?: number | string
      height?: number | string
      fabric?: string
      price?: number | string
      stock?: number | string
      imageUrls?: string[]
      imageKeys?: string[]
    }> = []
    if (variantsJson) {
      try {
        variants = JSON.parse(variantsJson)
      } catch {
        return NextResponse.json({ success: false, message: "Invalid variants data format" }, { status: 400 })
      }
    }

    let hamperItems: Array<{
      name: string
      imageUrls?: string[]
      imageKeys?: string[]
      variants?: Array<{
        weight?: number | string
        length?: number | string
        width?: number | string
        height?: number | string
        fabric?: string
        price?: number | string
        stock?: number | string
        imageUrls?: string[]
        imageKeys?: string[]
      }>
    }> = []

    if (hamperItemsJson) {
      try {
        const parsed = JSON.parse(hamperItemsJson)
        if (Array.isArray(parsed)) {
          hamperItems = parsed
            .map((item) => ({
              name: typeof item.name === "string" ? item.name.trim() : "",
              imageUrls: Array.isArray(item.imageUrls)
                ? item.imageUrls.filter((url: unknown) => typeof url === "string" && url.trim())
                : [],
              imageKeys: Array.isArray(item.imageKeys)
                ? item.imageKeys.filter((key: unknown) => typeof key === "string" && key.trim())
                : [],
              variants: Array.isArray(item.variants) ? item.variants : [],
            }))
            .filter(
              (item) =>
                item.name ||
                (item.imageUrls && item.imageUrls.length > 0) ||
                (item.imageKeys && item.imageKeys.length > 0) ||
                (item.variants && item.variants.length > 0),
            )
        }
      } catch {
        return NextResponse.json({ success: false, message: "Invalid hamper items data format" }, { status: 400 })
      }
    }

    if (productType === "hamper" && hamperItems.length === 0) {
      return NextResponse.json({ success: false, message: "At least one hamper item is required" }, { status: 400 })
    }

    if (productType === "single" && hamperItems.length > 0) {
      productType = "hamper"
    }

    if (productType !== "single" && productType !== "hamper") {
      return NextResponse.json(
        { success: false, message: "Product type must be either single or hamper" },
        { status: 400 },
      )
    }

    if (productType === "single" && (!Array.isArray(variants) || variants.length === 0)) {
      return NextResponse.json({ success: false, message: "At least one variant is required" }, { status: 400 })
    }

    const hamperPrice =
      productType === "hamper" && hamperPriceRaw !== null && hamperPriceRaw !== ""
        ? Number.parseFloat(String(hamperPriceRaw))
        : undefined
    if (productType === "hamper") {
      if (!hamperPrice || !Number.isFinite(hamperPrice) || hamperPrice <= 0) {
        return NextResponse.json({ success: false, message: "Hamper price is required" }, { status: 400 })
      }
    }

    let hamperFabricOptions: string[] = []
    if (productType === "hamper") {
      try {
        const parsed = JSON.parse(hamperFabricOptionsJson)
        hamperFabricOptions = Array.isArray(parsed)
          ? parsed.filter((option) => typeof option === "string" && !!option.trim()).map((option) => option.trim())
          : []
      } catch {
        hamperFabricOptions = []
      }

      if (hamperFabric.trim()) {
        hamperFabricOptions = [hamperFabric.trim(), ...hamperFabricOptions]
      }
      hamperFabricOptions = Array.from(new Set(hamperFabricOptions))

      if (hamperFabricOptions.length === 0) {
        return NextResponse.json({ success: false, message: "At least one hamper fabric option is required" }, { status: 400 })
      }
    }

    let detailSections: Array<{
      title: string
      body: string
      imageUrl?: string
      imageAlt?: string
      imagePosition?: "left" | "right"
      imageKey?: string
    }> = []

    if (detailSectionsJson) {
      try {
        const parsed = JSON.parse(detailSectionsJson)
        if (Array.isArray(parsed)) {
          detailSections = parsed
            .map((section) => ({
              title: typeof section.title === "string" ? section.title.trim() : "",
              body: typeof section.body === "string" ? section.body.trim() : "",
              imageUrl: typeof section.imageUrl === "string" ? section.imageUrl.trim() : "",
              imageAlt: typeof section.imageAlt === "string" ? section.imageAlt.trim() : "",
              imagePosition: section.imagePosition === "left" || section.imagePosition === "right" ? section.imagePosition : undefined,
              imageKey: typeof section.imageKey === "string" ? section.imageKey : undefined,
            }))
            .filter((section) => section.title || section.body || section.imageUrl || section.imageKey)
        }
      } catch {
        return NextResponse.json({ success: false, message: "Invalid detail sections data format" }, { status: 400 })
      }
    }

    for (const variant of variants) {
      const imageKeys = Array.isArray(variant.imageKeys) ? variant.imageKeys : []
      const existingUrls = Array.isArray(variant.imageUrls)
        ? variant.imageUrls.filter((url) => typeof url === "string" && !!url.trim())
        : []
      const uploadedUrls: string[] = []

      for (const imageKey of imageKeys) {
        const file = formData.get(imageKey)
        if (!isFileLike(file)) continue

        const timestamp = Date.now()
        const filename = `products/${sellerEmail}/variants/${timestamp}_${(file as any).name ?? "image"}`
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        uploadedUrls.push(blob.url)
      }

      variant.imageUrls = [...existingUrls, ...uploadedUrls]
    }

    const processedVariants =
      productType === "single"
        ? variants.map((variant, index) => {
            const weight = Number.parseFloat(variant.weight)
            const length = Number.parseFloat(variant.length)
            const width = Number.parseFloat(variant.width)
            const height = Number.parseFloat(variant.height)
            const fabric = variant.fabric?.trim()
            const price = Number.parseFloat(variant.price)
            const stock = Number.parseInt(variant.stock, 10)

            if (isNaN(weight) || isNaN(length) || isNaN(width) || isNaN(height) || isNaN(price) || isNaN(stock)) {
              throw new Error(`Variant ${index + 1} has invalid numeric values. Please check all fields.`)
            }

            if (!fabric) {
              throw new Error(`Variant ${index + 1} requires a fabric selection.`)
            }

            if (weight <= 0 || length <= 0 || width <= 0 || height <= 0 || price <= 0 || stock < 0) {
              throw new Error(`Variant ${index + 1} has values that are too small or negative.`)
            }

            const imageUrls = Array.isArray(variant.imageUrls)
              ? variant.imageUrls.filter((url) => typeof url === "string" && !!url.trim())
              : []

            return {
              variantId: variant.id,
              weight,
              length,
              width,
              height,
              fabric,
              price,
              stock,
              imageUrls,
            }
          })
        : []

    const colorOptionsMap = new Map<string, string[]>()
    if (productType === "single") {
      for (const variant of processedVariants) {
        const existing = colorOptionsMap.get(variant.fabric) || []
        const merged = [...existing, ...(variant.imageUrls || [])].filter(
          (url, idx, arr) => typeof url === "string" && !!url.trim() && arr.indexOf(url) === idx,
        )
        if (merged.length > 0) {
          colorOptionsMap.set(variant.fabric, merged.slice(0, 6))
        }
      }

      const uniqueFabrics = Array.from(new Set(processedVariants.map((variant) => variant.fabric)))
      const missingFabric = uniqueFabrics.find((fabric) => (colorOptionsMap.get(fabric) || []).length === 0)
      if (missingFabric) {
        throw new Error(`At least one image is required for fabric "${missingFabric}".`)
      }
    }

    const colorOptions = Array.from(colorOptionsMap.entries()).map(([fabric, imageUrls]) => ({
      fabric,
      imageUrls,
    }))
    const normalizedVariants =
      productType === "single"
        ? processedVariants.map((variant) => ({
            ...variant,
            imageUrls: [],
          }))
        : processedVariants

    let existingImageUrls: string[] = []
    try {
      const parsed = JSON.parse(existingImageUrlsJson)
      if (Array.isArray(parsed)) {
        existingImageUrls = parsed.filter((url) => typeof url === "string" && !!url.trim())
      }
    } catch {
      existingImageUrls = []
    }

    const newImageFiles: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image_") && isFileLike(value)) {
        newImageFiles.push(value as File)
      }
    }

    if (existingImageUrls.length + newImageFiles.length > 6) {
      return NextResponse.json({ success: false, message: "Maximum 6 images allowed" }, { status: 400 })
    }

    const needsUploads =
      newImageFiles.length > 0 ||
      variants.some((variant) => Array.isArray(variant.imageKeys) && variant.imageKeys.length > 0) ||
      detailSections.some((section) => section.imageKey) ||
      hamperItems.some((item) => Array.isArray(item.imageKeys) && item.imageKeys.length > 0)
    if (needsUploads && !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          message: "Image storage is not configured. Please add BLOB_READ_WRITE_TOKEN to your environment variables.",
        },
        { status: 500 },
      )
    }

    const uploadedImageUrls = await Promise.all(
      newImageFiles.map(async (file, index) => {
        const timestamp = Date.now()
        const filename = `products/${sellerEmail}/${timestamp}_${index}_${file.name}`

        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        return blob.url
      }),
    )

    if (detailSections.length > 0) {
      await Promise.all(
        detailSections.map(async (section) => {
          if (!section.imageKey) return
          const file = formData.get(section.imageKey)
          if (!isFileLike(file)) return

          const timestamp = Date.now()
          const filename = `products/${sellerEmail}/detail-sections/${timestamp}_${(file as any).name ?? "image"}`

          const blob = await put(filename, file, {
            access: "public",
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })

          section.imageUrl = blob.url
        }),
      )
    }

    detailSections = detailSections.map(({ imageKey, ...rest }) => rest)

    if (hamperItems.length > 0) {
      await Promise.all(
        hamperItems.map(async (item) => {
          if (!Array.isArray(item.imageKeys) || item.imageKeys.length === 0) return
          if (!Array.isArray(item.imageUrls)) item.imageUrls = []

          await Promise.all(
            item.imageKeys.map(async (imageKey) => {
              const file = formData.get(imageKey)
              if (!isFileLike(file)) return

              const timestamp = Date.now()
              const filename = `products/${sellerEmail}/hamper-items/${timestamp}_${(file as any).name ?? "image"}`

              const blob = await put(filename, file, {
                access: "public",
                addRandomSuffix: true,
                token: process.env.BLOB_READ_WRITE_TOKEN,
              })

              item.imageUrls?.push(blob.url)
            }),
          )
        }),
      )
    }

    if (hamperItems.length > 0) {
      await Promise.all(
        hamperItems.map(async (item) => {
          const itemVariants = Array.isArray(item.variants) ? item.variants : []
          await Promise.all(
            itemVariants.map(async (variant) => {
              const imageKeys = Array.isArray(variant.imageKeys) ? variant.imageKeys : []
              const existingUrls = Array.isArray(variant.imageUrls)
                ? variant.imageUrls.filter((url) => typeof url === "string" && !!url.trim())
                : []
              const uploadedUrls: string[] = []

              await Promise.all(
                imageKeys.map(async (imageKey) => {
                  const file = formData.get(imageKey)
                  if (!isFileLike(file)) return

                  const timestamp = Date.now()
                  const filename = `products/${sellerEmail}/hamper-variants/${timestamp}_${(file as any).name ?? "image"}`

                  const blob = await put(filename, file, {
                    access: "public",
                    addRandomSuffix: true,
                    token: process.env.BLOB_READ_WRITE_TOKEN,
                  })

                  uploadedUrls.push(blob.url)
                }),
              )

              variant.imageUrls = [...existingUrls, ...uploadedUrls]
            }),
          )
        }),
      )
    }

    const processedHamperItems = hamperItems.map((item, index) => {
      if (!item.name) {
        throw new Error(`Hamper item ${index + 1} requires a name.`)
      }
      const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : []

      const rawVariants = Array.isArray(item.variants) ? item.variants : []
      if (productType === "hamper" && rawVariants.length === 0) {
        throw new Error(`Hamper item ${index + 1} must include at least one variant option.`)
      }

      const variants = rawVariants.map((variant, variantIndex) => {
        const weight = Number.parseFloat(String(variant.weight ?? ""))
        const length = Number.parseFloat(String(variant.length ?? ""))
        const width = Number.parseFloat(String(variant.width ?? ""))
        const height = Number.parseFloat(String(variant.height ?? ""))
        const fabric = typeof variant.fabric === "string" ? variant.fabric.trim() : ""
        const stock = Number.parseInt(String(variant.stock ?? "0"), 10)
        const variantImageUrls = Array.isArray(variant.imageUrls)
          ? variant.imageUrls.filter((url) => typeof url === "string" && !!url.trim())
          : []

        if (isNaN(weight) || isNaN(length) || isNaN(width) || isNaN(height) || isNaN(stock)) {
          throw new Error(
            `Hamper item ${index + 1} variant ${variantIndex + 1} has invalid numeric values.`,
          )
        }

        if (weight <= 0 || length <= 0 || width <= 0 || height <= 0 || stock < 0) {
          throw new Error(
            `Hamper item ${index + 1} variant ${variantIndex + 1} has values that are too small or negative.`,
          )
        }
        if (!fabric) {
          throw new Error(`Hamper item ${index + 1} variant ${variantIndex + 1} requires fabric.`)
        }
        if (variantImageUrls.length === 0) {
          throw new Error(`Hamper item ${index + 1} variant ${variantIndex + 1} requires at least one image.`)
        }

        return {
          weight,
          length,
          width,
          height,
          fabric,
          stock,
          imageUrls: variantImageUrls,
        }
      })

      return {
        name: item.name,
        imageUrls,
        variants,
      }
    })

    await connectDB()

    const existingProduct = await Product.findById(id).lean()
    if (!existingProduct) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    const nextImageUrls = [...existingImageUrls, ...uploadedImageUrls]
    const colorOptionPrimary = colorOptions[0]?.imageUrls?.[0]
    const primaryImage =
      uploadedImageUrls[0] ||
      colorOptionPrimary ||
      nextImageUrls[0] ||
      (productType === "single" ? processedVariants[0]?.imageUrls?.[0] : undefined) ||
      ""
    const resolvedImageUrls =
      uploadedImageUrls.length > 0
        ? nextImageUrls
        : colorOptionPrimary
          ? [colorOptionPrimary]
          : nextImageUrls.length > 0
            ? nextImageUrls
            : productType === "single"
              ? (processedVariants[0]?.imageUrls?.slice(0, 1) ?? [])
              : []

    const product = await Product.findByIdAndUpdate(
      id,
      {
        productType,
        productTitle,
        description,
        units,
        sellerName,
        sellerEmail: sellerEmail.toLowerCase(),
        location,
        category: categoryLower,
        subCategory: subCategory || undefined,
        productRole: productRole === "complementary" ? "complementary" : "normal",
        primaryImage,
        imageUrls: resolvedImageUrls,
        variants: normalizedVariants,
        colorOptions: productType === "single" ? colorOptions : [],
        detailSections,
        hamperItems: productType === "hamper" ? processedHamperItems : [],
        hamperPrice: productType === "hamper" ? hamperPrice : undefined,
        hamperFabric: productType === "hamper" ? hamperFabricOptions[0] : undefined,
        hamperFabricOptions: productType === "hamper" ? hamperFabricOptions : [],
      },
      { new: true, runValidators: true },
    )

    const previousHamperImageUrls = Array.isArray(existingProduct.hamperItems)
      ? existingProduct.hamperItems
          .flatMap((item: any) => [
            ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
            ...((Array.isArray(item.variants) ? item.variants : []).flatMap((variant: any) => variant.imageUrls || [])),
          ])
          .filter(Boolean)
      : []
    const nextHamperImageUrls = processedHamperItems
      .flatMap((item) => [
        ...(item.imageUrls || []),
        ...((item.variants || []).flatMap((variant: any) => variant.imageUrls || [])),
      ])
      .filter(Boolean)
    const removedHamperImageUrls = previousHamperImageUrls.filter((url: string) => !nextHamperImageUrls.includes(url))

    const removedImageUrls = existingProduct.imageUrls.filter((url: string) => !resolvedImageUrls.includes(url))
    const previousVariantImageUrls = Array.isArray((existingProduct as any).variants)
      ? (existingProduct as any).variants.flatMap((variant: any) => variant.imageUrls || []).filter(Boolean)
      : []
    const previousColorOptionImageUrls = Array.isArray((existingProduct as any).colorOptions)
      ? (existingProduct as any).colorOptions.flatMap((option: any) => option.imageUrls || []).filter(Boolean)
      : []
    const nextColorOptionImageUrls = colorOptions.flatMap((option: any) => option.imageUrls || []).filter(Boolean)
    const nextVariantImageUrls = normalizedVariants.flatMap((variant: any) => variant.imageUrls || []).filter(Boolean)
    const removedVariantImageUrls = previousVariantImageUrls.filter(
      (url: string) => !nextVariantImageUrls.includes(url) && !nextColorOptionImageUrls.includes(url),
    )
    const removedColorOptionImageUrls = previousColorOptionImageUrls.filter(
      (url: string) => !nextColorOptionImageUrls.includes(url),
    )
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const urlsToDelete = [
        ...removedImageUrls,
        ...removedHamperImageUrls,
        ...removedVariantImageUrls,
        ...removedColorOptionImageUrls,
      ]
      if (urlsToDelete.length > 0) {
        await Promise.all(
          urlsToDelete.map(async (imageUrl) => {
            try {
              await del(imageUrl)
            } catch (deleteError) {
              console.error(`[v0] Error deleting removed image ${imageUrl}:`, deleteError)
            }
          }),
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        product,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[PRODUCT_UPDATE_ERROR]", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update product" },
      { status: 500 },
    )
  }
}
