import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Product from "@/models/Product"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const limit = parseInt(searchParams.get("limit") || "5", 10)

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: "No search query provided",
        },
        { status: 200 }
      )
    }

    await dbConnect()

    // Search products by title, description, or category
    const searchLower = query.toLowerCase()

    const products = await Product.find({
      status: "visible",
      $or: [
        { productTitle: { $regex: searchLower, $options: "i" } },
        { description: { $regex: searchLower, $options: "i" } },
        { category: { $regex: searchLower, $options: "i" } },
        { subCategory: { $regex: searchLower, $options: "i" } },
      ],
    })
      .select("_id productTitle description category subCategory primaryImage imageUrls variants hamperPrice")
      .limit(limit)
      .lean()

    // Transform results to match frontend expectations
    const formattedResults = products.map((product: any) => ({
      id: product._id,
      name: product.productTitle,
      description: product.description?.substring(0, 100) || "",
      category: product.category,
      subCategory: product.subCategory,
      image: product.primaryImage || product.imageUrls?.[0] || "/placeholder.png",
      price:
        typeof product.hamperPrice === "number"
          ? product.hamperPrice
          : Array.isArray(product.variants) && product.variants.length > 0
            ? Math.min(...product.variants.map((variant: any) => variant.price || 0))
            : 0,
    }))

    return NextResponse.json(
      {
        success: true,
        data: formattedResults,
        total: formattedResults.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Search API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to search products",
      },
      { status: 500 }
    )
  }
}
