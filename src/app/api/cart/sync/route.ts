import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import Cart from "@/models/cart"
import { verifyToken } from "@/lib/jwt"

interface SyncRequest {
  userId: string
  lastSyncVersion?: number
  lastSyncTime?: string
}

/**
 * Sync cart across browsers - returns latest cart state
 * Used for real-time cross-browser synchronization
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

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

    const body: SyncRequest = await request.json()
    const userId = decoded.userId

    // Find user's active cart
    const cart = await Cart.findOne({
      userId,
      status: "active",
    })

    if (!cart) {
      return NextResponse.json(
        {
          success: true,
          hasSyncedChanges: false,
          cart: null,
          lastSyncVersion: 0,
        },
        { status: 200 }
      )
    }

    // Check if there are changes since last sync
    const lastSyncVersion = body.lastSyncVersion || 0
    const hasSyncedChanges = cart.cartVersion > lastSyncVersion

    // Update last activity timestamp
    await Cart.findByIdAndUpdate(cart._id, {
      lastActivityAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        hasSyncedChanges,
        cart: {
          cartId: cart.cartId,
          items: cart.items,
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          discount: cart.discount,
          appliedCoupons: cart.appliedCoupons || [],
          total: cart.total,
          cartVersion: cart.cartVersion,
          updatedAt: cart.updatedAt,
        },
        lastSyncVersion: cart.cartVersion,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Error syncing cart:", error)
    return NextResponse.json(
      { error: "Failed to sync cart" },
      { status: 500 }
    )
  }
}
