import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import Order from "@/models/order"
import User from "@/models/User"
import { verifyToken } from "@/lib/jwt"

/**
 * GET — summary of completed orders per agent (coupon attribution).
 * GET ?agentId= — list customer/order rows for that agent (coupon-driven sales).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const agentId = request.nextUrl.searchParams.get("agentId")

    if (agentId) {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return NextResponse.json({ error: "Invalid agent id" }, { status: 400 })
      }

      const agentOid = new mongoose.Types.ObjectId(agentId)

      const agent = await User.findById(agentOid).select("fullname email phone role").lean()

      const limitParam = request.nextUrl.searchParams.get("limit")
      const limit = Math.min(Number.parseInt(limitParam || "200", 10) || 200, 1000)

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

      const rows = orders.map((o) => ({
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
        agent: agent
          ? {
              id: agent._id.toString(),
              fullname: agent.fullname,
              email: agent.email,
              phone: agent.phone,
              role: agent.role,
            }
          : null,
        orders: rows,
      })
    }

    const agg = await Order.aggregate([
      {
        $match: {
          couponAgentId: { $ne: null },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: "$couponAgentId",
          orderCount: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          discountGiven: { $sum: "$discount" },
        },
      },
    ])

    const ids = agg.map((a) => a._id).filter(Boolean)
    const users = await User.find({
      _id: { $in: ids },
      role: "agent",
    })
      .select("fullname email")
      .lean()

    const nameById = new Map(users.map((u) => [u._id.toString(), u]))

    const agents = agg.map((row) => {
      const id = row._id?.toString?.() ?? ""
      const u = nameById.get(id)
      return {
        agentId: id,
        agentName: u?.fullname ?? "Unknown",
        agentEmail: u?.email ?? "",
        orderCount: row.orderCount,
        revenue: row.revenue,
        discountGiven: row.discountGiven,
      }
    })

    agents.sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({ success: true, agents })
  } catch (error) {
    console.error("[admin/agent-coupon-sales]", error)
    return NextResponse.json({ error: "Failed to load agent coupon sales" }, { status: 500 })
  }
}
