import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupons"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      )
    }

    if (subtotal === undefined || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: "Valid subtotal is required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find the coupon by code (case-insensitive)
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      status: "active",
    })

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive coupon code" },
        { status: 404 }
      )
    }

    // Agent-assigned coupons work like any other code at checkout; sales are attributed via order.couponAgentId.

    // Check if coupon is expired
    if (new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Coupon has expired" },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: "Coupon usage limit reached" },
        { status: 400 }
      )
    }

    // Check minimum purchase requirement
    if (subtotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum purchase of ₹${coupon.minPurchase} required. Current: ₹${subtotal}`,
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.type === "percentage") {
      discountAmount = (subtotal * coupon.discount) / 100
      // Apply max discount limit if set
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else if (coupon.type === "fixed") {
      discountAmount = coupon.discount
    }

    return NextResponse.json(
      {
        success: true,
        coupon: {
          code: coupon.code,
          type: coupon.type,
          discount: coupon.discount,
          discountAmount: Math.round(discountAmount * 100) / 100,
          maxDiscount: coupon.maxDiscount || null,
          minPurchase: coupon.minPurchase,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    )
  }
}
