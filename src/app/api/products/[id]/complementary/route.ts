import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import mongoose from "mongoose"

export const runtime = "nodejs"

// GET - Fetch complementary products for a specific product
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid product ID" }, { status: 400 })
    }

    // Fetch the product with populated complementary products
    const product = await Product.findById(id).populate({
      path: "complementaryProductIds",
      select: "_id productTitle primaryImage imageUrls variants",
      match: { status: "visible" },
    })

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    // Format complementary products
    const complementaryProducts = (product.complementaryProductIds || []).map((cp: any) => ({
      _id: cp._id.toString(),
      productTitle: cp.productTitle,
      image: cp.primaryImage || cp.imageUrls?.[0] || null,
      basePrice: cp.variants?.[0]?.price || 0,
    }))

    return NextResponse.json({
      success: true,
      complementaryProducts,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching complementary products:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch complementary products" },
      { status: 500 }
    )
  }
}
