import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import Cart from "@/models/cart"
import { verifyToken } from "@/lib/jwt"

interface UpdateCartRequest {
  userId: string
  action: "update_quantity" | "remove_item" | "update_cart"
  itemId?: string
  quantity?: number
  items?: Array<{
    id: string
    name: string
    image: string
    quantity: number
    price: number
    size?: string
    fabric?: string
    productColor?: string
    productColorHex?: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Verify user is authenticated
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = verifyToken(token)
      if (!decoded || !decoded.userId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: "Token verification failed" },
        { status: 401 }
      )
    }

    const body: UpdateCartRequest = await request.json()
    const userId = decoded.userId

    // Find user's active cart
    const cart = await Cart.findOne({
      userId,
      status: "active",
    })

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      )
    }

    // Handle different actions
    if (body.action === "remove_item") {
      if (!body.itemId) {
        return NextResponse.json(
          { error: "itemId is required" },
          { status: 400 }
        )
      }

      // Remove item from cart
      cart.items = cart.items.filter((item: any) => item.id !== body.itemId)

      // Recalculate totals
      const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const totalQuantity = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      const shipping = 0
      const total = subtotal + shipping

      cart.subtotal = subtotal
      cart.shipping = shipping
      cart.total = total
      cart.lastActivityAt = new Date()

      await cart.save()

      return NextResponse.json(
        {
          success: true,
          message: "Item removed from cart",
          cart: {
            cartId: cart.cartId,
            items: cart.items,
            subtotal: cart.subtotal,
            shipping: cart.shipping,
            discount: cart.discount,
            total: cart.total,
          },
        },
        { status: 200 }
      )
    }

    if (body.action === "update_quantity") {
      if (!body.itemId || body.quantity === undefined) {
        return NextResponse.json(
          { error: "itemId and quantity are required" },
          { status: 400 }
        )
      }

      if (body.quantity < 1) {
        // Remove item if quantity is 0 or less
        cart.items = cart.items.filter((item: any) => item.id !== body.itemId)
      } else {
        // Update quantity
        const itemIndex = cart.items.findIndex((item: any) => item.id === body.itemId)
        if (itemIndex === -1) {
          return NextResponse.json(
            { error: "Item not found in cart" },
            { status: 404 }
          )
        }
        cart.items[itemIndex].quantity = body.quantity
      }

      // Recalculate totals
      const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const totalQuantity = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      const shipping = 0
      const total = subtotal + shipping

      cart.subtotal = subtotal
      cart.shipping = shipping
      cart.total = total
      cart.lastActivityAt = new Date()

      await cart.save()

      return NextResponse.json(
        {
          success: true,
          message: "Cart updated successfully",
          cart: {
            cartId: cart.cartId,
            items: cart.items,
            subtotal: cart.subtotal,
            shipping: cart.shipping,
            discount: cart.discount,
            total: cart.total,
          },
        },
        { status: 200 }
      )
    }

    if (body.action === "update_cart") {
      if (!body.items || !Array.isArray(body.items)) {
        return NextResponse.json(
          { error: "items array is required" },
          { status: 400 }
        )
      }

      // Replace entire cart items
      cart.items = body.items.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        fabric: item.fabric,
        productColor: item.productColor,
        productColorHex: item.productColorHex,
      }))

      // Recalculate totals
      const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const totalQuantity = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      const shipping = 0
      const total = subtotal + shipping

      cart.subtotal = subtotal
      cart.shipping = shipping
      cart.total = total
      cart.lastActivityAt = new Date()

      await cart.save()

      return NextResponse.json(
        {
          success: true,
          message: "Cart updated successfully",
          cart: {
            cartId: cart.cartId,
            items: cart.items,
            subtotal: cart.subtotal,
            shipping: cart.shipping,
            discount: cart.discount,
            total: cart.total,
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[Cart Update] Error:", error)
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    )
  }
}
