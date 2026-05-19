import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import Order from "@/models/order"
import User from "@/models/User"
import { verifyToken } from "@/lib/jwt"

/** Calendar boundaries in Asia/Kolkata as UTC instants for Mongo date queries. */
function startOfMonthIST(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now)
  const y = Number(parts.find((p) => p.type === "year")?.value)
  const monthNum = Number(parts.find((p) => p.type === "month")?.value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return new Date(`${y}-${pad(monthNum)}-01T00:00:00+05:30`)
}

function startOfYearIST(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).formatToParts(now)
  const y = Number(parts.find((p) => p.type === "year")?.value)
  return new Date(`${y}-01-01T00:00:00+05:30`)
}

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

    const baseMatch = {
      couponAgentId: { $ne: null },
      paymentStatus: "completed" as const,
    }

    const monthStart = startOfMonthIST()
    const yearStart = startOfYearIST()

    const sumGroup = {
      _id: "$couponAgentId",
      orderCount: { $sum: 1 },
      grossOrderTotal: { $sum: { $ifNull: ["$subtotal", 0] } },
      netPaid: { $sum: { $ifNull: ["$totalAmount", 0] } },
      discountTotal: { $sum: { $ifNull: ["$discount", 0] } },
    }

    const [aggAll, aggMonth, aggYtd] = await Promise.all([
      Order.aggregate([{ $match: baseMatch }, { $group: sumGroup }]),
      Order.aggregate([
        {
          $match: {
            ...baseMatch,
            createdAt: { $gte: monthStart },
          },
        },
        { $group: sumGroup },
      ]),
      Order.aggregate([
        {
          $match: {
            ...baseMatch,
            createdAt: { $gte: yearStart },
          },
        },
        { $group: sumGroup },
      ]),
    ])

    const ids = aggAll.map((a) => a._id).filter(Boolean)
    const users = await User.find({
      _id: { $in: ids },
      role: "agent",
    })
      .select("fullname email")
      .lean()

    const nameById = new Map(users.map((u) => [u._id.toString(), u]))

    type PeriodAgg = {
      orderCount: number
      grossOrderTotal: number
      netPaid: number
      discountTotal: number
    }

    const toPeriod = (r: PeriodAgg | undefined) =>
      r
        ? {
            orderCount: r.orderCount,
            grossOrderTotal: r.grossOrderTotal,
            netPaid: r.netPaid,
            discountTotal: r.discountTotal,
          }
        : {
            orderCount: 0,
            grossOrderTotal: 0,
            netPaid: 0,
            discountTotal: 0,
          }

    const monthMap = new Map(
      aggMonth.map((r) => [
        r._id?.toString?.() ?? "",
        {
          orderCount: r.orderCount,
          grossOrderTotal: r.grossOrderTotal,
          netPaid: r.netPaid,
          discountTotal: r.discountTotal,
        } as PeriodAgg,
      ]),
    )
    const ytdMap = new Map(
      aggYtd.map((r) => [
        r._id?.toString?.() ?? "",
        {
          orderCount: r.orderCount,
          grossOrderTotal: r.grossOrderTotal,
          netPaid: r.netPaid,
          discountTotal: r.discountTotal,
        } as PeriodAgg,
      ]),
    )

    const agents = aggAll.map((row) => {
      const id = row._id?.toString?.() ?? ""
      const u = nameById.get(id)
      const m = monthMap.get(id)
      const y = ytdMap.get(id)
      const allTime: PeriodAgg = {
        orderCount: row.orderCount,
        grossOrderTotal: row.grossOrderTotal,
        netPaid: row.netPaid,
        discountTotal: row.discountTotal,
      }
      return {
        agentId: id,
        agentName: u?.fullname ?? "Unknown",
        agentEmail: u?.email ?? "",
        thisMonth: toPeriod(m),
        ytd: toPeriod(y),
        allTime: toPeriod(allTime),
        /** @deprecated use allTime.netPaid — kept for older clients */
        revenue: row.netPaid,
        discountGiven: row.discountTotal,
      }
    })

    agents.sort((a, b) => b.allTime.netPaid - a.allTime.netPaid)

    return NextResponse.json({
      success: true,
      periods: {
        monthStartsAt: monthStart.toISOString(),
        yearStartsAt: yearStart.toISOString(),
        timezone: "Asia/Kolkata",
      },
      agents,
    })
  } catch (error) {
    console.error("[admin/agent-coupon-sales]", error)
    return NextResponse.json({ error: "Failed to load agent coupon sales" }, { status: 500 })
  }
}
