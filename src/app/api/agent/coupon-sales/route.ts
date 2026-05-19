import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import Order from "@/models/order"
import { verifyToken } from "@/lib/jwt"

/** Orders attributed to this agent via agent-assigned coupon (couponAgentId). */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("agent_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "agent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const agentOid = new mongoose.Types.ObjectId(decoded.userId)

    const [summaryAgg] = await Order.aggregate([
      {
        $match: {
          couponAgentId: agentOid,
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          discountGiven: { $sum: "$discount" },
        },
      },
    ])

    const summary = {
      orderCount: summaryAgg?.orderCount ?? 0,
      revenue: summaryAgg?.revenue ?? 0,
      discountGiven: summaryAgg?.discountGiven ?? 0,
    }

    const limitParam = request.nextUrl.searchParams.get("limit")
    const limit = Math.min(Number.parseInt(limitParam || "100", 10) || 100, 500)

    const orders = await Order.find({
      couponAgentId: agentOid,
      paymentStatus: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "orderId customerName customerEmail customerPhone couponCode discount totalAmount subtotal createdAt orderStatus",
      )
      .lean()

    const payload = orders.map((o) => ({
      orderId: o.orderId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      couponCode: o.couponCode,
      subtotal: o.subtotal,
      discount: o.discount,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      orderStatus: o.orderStatus,
    }))

    return NextResponse.json({
      success: true,
      summary,
      orders: payload,
    })
  } catch (error) {
    console.error("[agent/coupon-sales]", error)
    return NextResponse.json({ error: "Failed to load sales" }, { status: 500 })
  }
}
