import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import mongoose from "mongoose"

export const runtime = "nodejs"

const toNumberOrNull = (value: string | null) => {
  if (value === null || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid product ID format" }, { status: 400 })
    }

    const url = new URL(request.url)
    const fabric = (url.searchParams.get("fabric") || "").trim()
    const length = toNumberOrNull(url.searchParams.get("length"))
    const width = toNumberOrNull(url.searchParams.get("width"))
    const height = toNumberOrNull(url.searchParams.get("height"))

    if (!fabric) {
      return NextResponse.json({ success: false, message: "fabric is required" }, { status: 400 })
    }

    const product = await Product.findById(id).select("variants colorOptions imageUrls primaryImage status").lean()
    if (!product || product.status === "hidden") {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    const variants = Array.isArray((product as any).variants) ? (product as any).variants : []
    const colorOptions = Array.isArray((product as any).colorOptions) ? (product as any).colorOptions : []
    const colorOption = colorOptions.find(
      (option: any) =>
        option.fabric === fabric && Array.isArray(option.imageUrls) && option.imageUrls.length > 0,
    )
    const exactVariant =
      length !== null && width !== null && height !== null
        ? variants.find(
            (variant: any) =>
              variant.fabric === fabric &&
              Number(variant.length) === length &&
              Number(variant.width) === width &&
              Number(variant.height) === height &&
              Array.isArray(variant.imageUrls) &&
              variant.imageUrls.length > 0,
          )
        : null

    const fallbackVariant = variants.find(
      (variant: any) =>
        variant.fabric === fabric && Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0,
    )

    const imageUrls =
      exactVariant?.imageUrls ||
      fallbackVariant?.imageUrls ||
      colorOption?.imageUrls ||
      ((product as any).primaryImage
        ? [(product as any).primaryImage, ...(((product as any).imageUrls || []).filter((url: string) => url !== (product as any).primaryImage)]
        : (product as any).imageUrls || [])

    return NextResponse.json(
      {
        success: true,
        imageUrls,
        source: exactVariant
          ? "exact"
          : fallbackVariant
            ? "fabric-fallback"
            : colorOption
              ? "color-option"
              : "product-fallback",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[PRODUCT_VARIANT_IMAGES_ERROR]", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch variant images" },
      { status: 500 },
    )
  }
}
