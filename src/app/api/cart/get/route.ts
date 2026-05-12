import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Cart from "@/models/cart"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const cartId = searchParams.get("cartId")
    const userId = searchParams.get("userId")

    if (!cartId && !userId) {
      return NextResponse.json(
        { error: "cartId or userId is required" },
        { status: 400 }
      )
    }

    let query: any = {}
    if (cartId) {
      query.cartId = cartId
    } else if (userId) {
      query.userId = userId
      query.status = "active"
    }

    const cart = await Cart.findOne(query).sort({ updatedAt: -1 })

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      )
    }

    // Update last activity
    await Cart.findByIdAndUpdate(cart._id, {
      lastActivityAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        cart: {
          cartId: cart.cartId,
          items: cart.items,
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          discount: cart.discount,
          total: cart.total,
          userEmail: cart.userEmail,
          userName: cart.userName,
          userPhone: cart.userPhone,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    )
  }
}
