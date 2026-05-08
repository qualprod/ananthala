import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import Cart from "@/models/cart"
import { verifyToken } from "@/lib/jwt"
import { nanoid } from "nanoid"

interface SaveCartRequest {
  items: Array<{
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
  email?: string
  userId?: string
  userFullname?: string
  userAgent?: string
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body: SaveCartRequest = await request.json()

    // Validate required fields
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      )
    }

    if (body.items.length === 0) {
      return NextResponse.json(
        { error: "Cart cannot be empty" },
        { status: 400 }
      )
    }

    // Try to extract user info from JWT token in cookies
    let userId: string | null = null
    let userEmail: string = body.email || "guest@ananthala.com"
    let userName: string | undefined = body.userFullname
    let userPhone: string | undefined = undefined

    try {
      const cookieStore = await cookies()
      const token = cookieStore.get("auth_token")?.value

      if (token) {
        const decoded = verifyToken(token)
        if (decoded) {
          userId = decoded.userId || null
          userEmail = decoded.email || userEmail
          userName = decoded.fullname || body.userFullname
        }
      }
    } catch (tokenError) {
      console.error("[Cart Save] Token verification error:", tokenError)
      // Continue with provided email if token verification fails
    }

    // Get session/IP info
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Create unique cart ID
    const cartId = `cart_${Date.now()}_${nanoid(8)}`

    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalQuantity = body.items.reduce((sum, item) => sum + item.quantity, 0)
    const shipping = 0
    const total = subtotal + shipping

    // Create cart document with real user info
    const cart = await Cart.create({
      cartId,
      items: body.items.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        fabric: item.fabric,
        productColor: item.productColor,
        productColorHex: item.productColorHex,
      })),
      userId: userId || undefined, // Will be null if not logged in
      userEmail,
      userName,
      userPhone,
      subtotal,
      shipping,
      discount: 0,
      total,
      status: "active",
      ipAddress: ip,
      userAgent: body.userAgent || userAgent,
      cartVersion: 1,
      lastActivityAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        cartId: cart.cartId,
        message: "Cart saved successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Cart Save] Error:", error)
    return NextResponse.json(
      { error: "Failed to save cart" },
      { status: 500 }
    )
  }
}
