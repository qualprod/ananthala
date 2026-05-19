import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import Coupon from "@/models/Coupons"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    // Get all coupons
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()

    console.log("[v0] Fetched coupons count:", coupons.length)

    // Populate agent names for each coupon if not already populated
    const User = require("@/models/User").default
    const updatedCoupons = await Promise.all(
      coupons.map(async (coupon: any) => {
        let agentNames = coupon.agentNames || []

        // If agents exist but agentNames is empty, fetch agent names
        if (coupon.agents && coupon.agents.length > 0 && agentNames.length === 0) {
          const agentUsers = await User.find({ _id: { $in: coupon.agents } }, { fullname: 1 }).lean()
          agentNames = agentUsers.map((user: any) => user.fullname)
          console.log(`[v0] Fetched names for coupon ${coupon.code}:`, agentNames)
        }

        return {
          ...coupon,
          _id: coupon._id.toString(),
          agents: coupon.agents || [],
          agentNames: agentNames,
          status: new Date(coupon.expiryDate) < new Date() ? "expired" : coupon.status,
        }
      }),
    )

    return NextResponse.json({ success: true, coupons: updatedCoupons })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { code, discount, type, minPurchase, maxDiscount, usageLimit, expiryDate, agents = [], agentNames = [] } = body

    // Validation
    if (!code || !discount || !type || minPurchase === undefined || !usageLimit || !expiryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (discount <= 0) {
      return NextResponse.json({ error: "Discount must be greater than 0" }, { status: 400 })
    }

    if (type !== "percentage" && type !== "fixed") {
      return NextResponse.json({ error: "Invalid discount type" }, { status: 400 })
    }

    if (type === "percentage" && discount > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 })
    }

    if (minPurchase < 0) {
      return NextResponse.json({ error: "Minimum purchase cannot be negative" }, { status: 400 })
    }

    if (usageLimit < 1) {
      return NextResponse.json({ error: "Usage limit must be at least 1" }, { status: 400 })
    }

    if (agents.length > 1) {
      return NextResponse.json(
        {
          error:
            "Agent coupons must have exactly one assigned agent. Create a separate coupon code for each agent.",
        },
        { status: 400 },
      )
    }

    // Set expiry date to end of day (23:59:59)
    const expiryDateTime = new Date(expiryDate)
    expiryDateTime.setHours(23, 59, 59, 999)
    
    // Allow today's date or future dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (expiryDateTime < today) {
      return NextResponse.json({ error: "Expiry date must be today or in the future" }, { status: 400 })
    }

    await connectDB()

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 })
    }

    // Fetch actual agent names from User collection based on agent IDs
    let populatedAgentNames: string[] = []
    if (agents.length > 0) {
      const User = require("@/models/User").default
      const agentUsers = await User.find({ _id: { $in: agents } }, { fullname: 1 }).lean()
      populatedAgentNames = agentUsers.map((user: any) => user.fullname)
      console.log("[v0] Fetched agent names:", populatedAgentNames)
    }

    // Create new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discount,
      type,
      minPurchase,
      maxDiscount: type === "percentage" ? maxDiscount : undefined,
      usageLimit,
      usedCount: 0,
      expiryDate: expiryDateTime,
      status: "active",
      createdBy: decoded.userId,
      agents: agents.length > 0 ? agents : [],
      agentNames: populatedAgentNames.length > 0 ? populatedAgentNames : [],
    })

    const savedCoupon = await newCoupon.save()

    return NextResponse.json(
      {
        success: true,
        message: "Coupon created successfully",
        coupon: {
          id: savedCoupon._id.toString(),
          code: savedCoupon.code,
          discount: savedCoupon.discount,
          type: savedCoupon.type,
          minPurchase: savedCoupon.minPurchase,
          maxDiscount: savedCoupon.maxDiscount,
          usageLimit: savedCoupon.usageLimit,
          usedCount: savedCoupon.usedCount,
          expiryDate: savedCoupon.expiryDate.toISOString().split("T")[0],
          status: savedCoupon.status,
          agents: savedCoupon.agents || [],
          agentNames: savedCoupon.agentNames || [],
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
