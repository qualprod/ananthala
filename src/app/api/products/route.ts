import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"

export const runtime = "nodejs"

function isFileLike(value: unknown): value is File {
  if (!value || typeof value !== "object") return false
  return typeof (value as any).arrayBuffer === "function"
}

// POST - Create new product
export async function POST(request: Request) {
  try {
    console.log("[v0] Product creation request received")

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN is not configured")
      return NextResponse.json(
        {
          success: false,
          message: "Image storage is not configured. Please add BLOB_READ_WRITE_TOKEN to your environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()

    // Extract product data
    const productTypeRaw = (formData.get("productType") as string) ?? "single"
    let productType = productTypeRaw.toLowerCase()
    const productRole = (formData.get("productRole") as string) || "normal"
    const productTitle = formData.get("productTitle") as string
    const description = formData.get("description") as string
    const units = formData.get("units") as string
    const sellerName = formData.get("sellerName") as string
    const sellerEmail = formData.get("sellerEmail") as string
    const location = formData.get("location") as string
    const category = formData.get("category") as string
    const subCategory = formData.get("subCategory") as string
    const variantsJson = formData.get("variants") as string
    const detailSectionsJson = formData.get("detailSections") as string
    const hamperItemsJson = formData.get("hamperItems") as string
    const hamperPriceRaw = formData.get("hamperPrice") as string | null
    const hamperFabric = (formData.get("hamperFabric") as string | null) ?? ""
    const hamperFabricOptionsJson = (formData.get("hamperFabricOptions") as string | null) ?? "[]"

    console.log("[v0] Received form data:", {
      productType,
      productTitle,
      description: description?.substring(0, 50) + "...",
      units,
      sellerName,
      sellerEmail,
      location,
      category,
      subCategory,
      productType,
      hasVariants: !!variantsJson,
      hasDetailSections: !!detailSectionsJson,
      hasHamperItems: !!hamperItemsJson,
    })

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

      console.error("[v0] Missing required fields:", missingFields)
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const categoryLower = category.toLowerCase()
    if (categoryLower !== "mattress" && categoryLower !== "pillow" && categoryLower !== "bedding" && categoryLower !== "joy" && categoryLower !== "bliss" && categoryLower !== "grace") {
      console.error("[v0] Invalid category:", category)
      return NextResponse.json(
        { success: false, message: "Category must be either joy,bliss,grace,Mattress, Pillow,Bedding or bedsheet" },
        { status: 400 },
      )
    }

    // Parse variants
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
        console.log("[v0] Parsed variants:", variants)
      } catch (parseError) {
        console.error("[v0] Error parsing variants JSON:", parseError)
        return NextResponse.json({ success: false, message: "Invalid variants data format" }, { status: 400 })
      }
    }

    // Parse hamper items (optional)
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
      } catch (parseError) {
        console.error("[v0] Error parsing hamper items JSON:", parseError)
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
      console.error("[v0] Invalid variants array:", variants)
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

    // Parse detail sections (optional)
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
      } catch (parseError) {
        console.error("[v0] Error parsing detail sections JSON:", parseError)
        return NextResponse.json({ success: false, message: "Invalid detail sections data format" }, { status: 400 })
      }
    }

    // Upload variant-specific images before validation so each variant can own its gallery.
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
        try {
          const blob = await put(filename, file, {
            access: "public",
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
          uploadedUrls.push(blob.url)
        } catch (uploadError: any) {
          console.error("[v0] Error uploading variant image:", uploadError)
          return NextResponse.json(
            {
              success: false,
              message: `Failed to upload variant image: ${uploadError.message || "Unknown error"}`,
            },
            { status: 500 },
          )
        }
      }

      variant.imageUrls = [...existingUrls, ...uploadedUrls]
    }

    // Process variants - convert string values to numbers and validate
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
              console.error(`[v0] Invalid numeric values in variant ${index + 1}:`, variant)
              throw new Error(`Variant ${index + 1} has invalid numeric values. Please check all fields.`)
            }

            if (!fabric) {
              console.error(`[v0] Missing fabric in variant ${index + 1}`)
              throw new Error(`Variant ${index + 1} requires a fabric selection.`)
            }

            if (weight <= 0 || length <= 0 || width <= 0 || height <= 0 || price <= 0 || stock < 0) {
              console.error(`[v0] Out of range values in variant ${index + 1}:`, variant)
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

    console.log("[v0] Processed variants:", processedVariants)

    // Extract and upload images
    const imageFiles: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image_") && isFileLike(value)) {
        imageFiles.push(value as File)
      }
    }

    console.log("[v0] Found", imageFiles.length, "images")

    if (imageFiles.length > 6) {
      return NextResponse.json({ success: false, message: "Maximum 6 images allowed" }, { status: 400 })
    }

    console.log(`[v0] Uploading ${imageFiles.length} images to Vercel Blob...`)

    // Upload images to Vercel Blob
    const imageUrls: string[] = []
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const timestamp = Date.now()
      const filename = `products/${sellerEmail}/${timestamp}_${i}_${file.name}`

      try {
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        imageUrls.push(blob.url)
        console.log(`[v0] Image ${i + 1} uploaded successfully: ${blob.url}`)
      } catch (uploadError: any) {
        console.error(`[v0] Error uploading image ${i + 1}:`, uploadError)
        return NextResponse.json(
          {
            success: false,
            message: `Failed to upload image ${i + 1}: ${uploadError.message || "Unknown error"}`,
          },
          { status: 500 },
        )
      }
    }

    if (detailSections.length > 0) {
      for (const section of detailSections) {
        if (!section.imageKey) continue
        const file = formData.get(section.imageKey)
        if (!isFileLike(file)) continue

        const timestamp = Date.now()
        const filename = `products/${sellerEmail}/detail-sections/${timestamp}_${(file as any).name ?? "image"}`

        try {
          const blob = await put(filename, file, {
            access: "public",
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
          section.imageUrl = blob.url
        } catch (uploadError: any) {
          console.error(`[v0] Error uploading detail section image:`, uploadError)
          return NextResponse.json(
            {
              success: false,
              message: `Failed to upload detail section image: ${uploadError.message || "Unknown error"}`,
            },
            { status: 500 },
          )
        }
      }
    }

    detailSections = detailSections.map(({ imageKey, ...rest }) => rest)

    if (hamperItems.length > 0) {
      for (const item of hamperItems) {
        if (!Array.isArray(item.imageKeys) || item.imageKeys.length === 0) continue
        if (!Array.isArray(item.imageUrls)) item.imageUrls = []

        for (const imageKey of item.imageKeys) {
          const file = formData.get(imageKey)
          if (!isFileLike(file)) continue

          const timestamp = Date.now()
          const filename = `products/${sellerEmail}/hamper-items/${timestamp}_${(file as any).name ?? "image"}`

          try {
            const blob = await put(filename, file, {
              access: "public",
              addRandomSuffix: true,
              token: process.env.BLOB_READ_WRITE_TOKEN,
            })
            item.imageUrls.push(blob.url)
          } catch (uploadError: any) {
            console.error(`[v0] Error uploading hamper item image:`, uploadError)
            return NextResponse.json(
              {
                success: false,
                message: `Failed to upload hamper item image: ${uploadError.message || "Unknown error"}`,
              },
              { status: 500 },
            )
          }
        }
      }
    }

    if (hamperItems.length > 0) {
      for (const item of hamperItems) {
        const itemVariants = Array.isArray(item.variants) ? item.variants : []
        for (const variant of itemVariants) {
          const imageKeys = Array.isArray(variant.imageKeys) ? variant.imageKeys : []
          const existingUrls = Array.isArray(variant.imageUrls)
            ? variant.imageUrls.filter((url) => typeof url === "string" && !!url.trim())
            : []
          const uploadedUrls: string[] = []

          for (const imageKey of imageKeys) {
            const file = formData.get(imageKey)
            if (!isFileLike(file)) continue

            const timestamp = Date.now()
            const filename = `products/${sellerEmail}/hamper-variants/${timestamp}_${(file as any).name ?? "image"}`
            try {
              const blob = await put(filename, file, {
                access: "public",
                addRandomSuffix: true,
                token: process.env.BLOB_READ_WRITE_TOKEN,
              })
              uploadedUrls.push(blob.url)
            } catch (uploadError: any) {
              console.error(`[v0] Error uploading hamper variant image:`, uploadError)
              return NextResponse.json(
                {
                  success: false,
                  message: `Failed to upload hamper variant image: ${uploadError.message || "Unknown error"}`,
                },
                { status: 500 },
              )
            }
          }

          variant.imageUrls = [...existingUrls, ...uploadedUrls]
        }
      }
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

    // Connect to database
    console.log("[v0] Connecting to database...")
    await connectDB()

    const primaryImage =
      imageUrls[0] ||
      colorOptions[0]?.imageUrls?.[0] ||
      (productType === "single" ? processedVariants[0]?.imageUrls?.[0] : undefined) ||
      ""
    const resolvedImageUrls =
      imageUrls.length > 0
        ? imageUrls
        : productType === "single"
          ? (processedVariants[0]?.imageUrls?.slice(0, 1) ?? [])
          : []

    const productData = {
      productType,
      productTitle,
      description,
      units,
      sellerName,
      sellerEmail: sellerEmail.toLowerCase(),
      location,
      category: categoryLower,
      subCategory: subCategory || undefined,
      primaryImage,
      productRole: productRole === "complementary" ? "complementary" : "normal",
      imageUrls: resolvedImageUrls,
      variants: normalizedVariants,
      colorOptions: productType === "single" ? colorOptions : [],
      detailSections,
      hamperItems: productType === "hamper" ? processedHamperItems : [],
      hamperPrice: productType === "hamper" ? hamperPrice : undefined,
      hamperFabric: productType === "hamper" ? hamperFabricOptions[0] : undefined,
      hamperFabricOptions: productType === "hamper" ? hamperFabricOptions : [],
      status: "visible",
    }

    console.log("[v0] Creating product in database with data:", {
      ...productData,
      description: productData.description.substring(0, 50) + "...",
      imageUrls: productData.imageUrls.length,
      variants: productData.variants.length,
      hamperItems: productData.hamperItems?.length ?? 0,
    })

    const product = await Product.create(productData)

    console.log("[v0] Product created successfully:", {
      id: product._id,
      title: product.productTitle,
      variants: product.variants.length,
      images: product.imageUrls.length,
      primaryImage: product.primaryImage,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product: {
          id: product._id,
          productTitle: product.productTitle,
          category: product.category,
          primaryImage: product.primaryImage,
          variantsCount: product.variants.length,
          imagesCount: product.imageUrls.length,
          status: product.status,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[v0] PRODUCT_CREATE_ERROR:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create product. Please try again." },
      { status: 500 },
    )
  }
}

// GET - Fetch all products (with optional filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const sellerEmail = searchParams.get("sellerEmail")
    const status = searchParams.get("status")
    const includeVariantImages = searchParams.get("includeVariantImages") === "true"

    await connectDB()

    // Build query
    const query: any = {}
    if (category && category !== "all") {
      query.category = category.toLowerCase()
    }
    if (sellerEmail) {
      query.sellerEmail = sellerEmail.toLowerCase()
    }
    if (status) {
      query.status = status
    }

    const projection = includeVariantImages
      ? {}
      : {
          detailSections: 0,
          hamperItems: 0,
          "variants.imageUrls": 0,
        }

    const products = await Product.find(query, projection).sort({ displayOrder: 1, createdAt: -1 }).lean()

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        products,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] PRODUCTS_FETCH_ERROR", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch products" }, { status: 500 })
  }
}
