import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import mongoose from "mongoose"

export const runtime = "nodejs"

// GET - Fetch all products that can be set as complementary
export async function GET(request: Request) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const excludeId = url.searchParams.get("excludeId")

    let query: any = { 
      status: "visible",
      productRole: "complementary" // Only show complementary products
    }

    // Exclude the current product to avoid circular references
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) }
    }

    const products = await Product.find(query).select("_id productTitle primaryImage imageUrls variants productRole").limit(100)

    const productsWithPrice = products.map((product) => ({
      _id: product._id.toString(),
      productTitle: product.productTitle,
      image: product.primaryImage || product.imageUrls?.[0] || null,
      basePrice: product.variants?.[0]?.price || 0,
      productRole: product.productRole || "complementary",
    }))

    return NextResponse.json({ success: true, products: productsWithPrice })
  } catch (error: any) {
    console.error("[v0] Error fetching complementary products:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// PUT - Update complementary products for a specific product
export async function PUT(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { productId, complementaryProductIds } = body

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, message: "Invalid product ID" }, { status: 400 })
    }

    if (!Array.isArray(complementaryProductIds)) {
      return NextResponse.json(
        { success: false, message: "complementaryProductIds must be an array" },
        { status: 400 }
      )
    }

    // Validate all complementary product IDs
    const validatedIds = complementaryProductIds.filter((id) => mongoose.Types.ObjectId.isValid(id))

    // Prevent self-reference
    if (validatedIds.some((id) => id === productId)) {
      return NextResponse.json(
        { success: false, message: "A product cannot be its own complementary product" },
        { status: 400 }
      )
    }

    // Verify all complementary products exist
    const complementaryProducts = await Product.find({
      _id: { $in: validatedIds },
    })

    if (complementaryProducts.length !== validatedIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more complementary products do not exist" },
        { status: 400 }
      )
    }

    // Update the product with complementary product IDs
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        complementaryProductIds: validatedIds,
      },
      { new: true }
    ).select("_id productTitle complementaryProductIds")

    return NextResponse.json(
      {
        success: true,
        message: "Complementary products updated successfully",
        product: updatedProduct,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] Error updating complementary products:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update complementary products" },
      { status: 500 }
    )
  }
}
