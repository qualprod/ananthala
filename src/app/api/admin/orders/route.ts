import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/order"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwtVerify(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 10

    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (status && status !== "all") {
      filter.orderStatus = status
    }
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ]
    }

    const orders = await Order.find(filter)
      .select(
        "orderId customerId customerName customerEmail customerPhone orderStatus totalAmount items orderTimeline createdAt updatedAt paymentStatus shippingAddress billingAddress",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalOrders = await Order.countDocuments(filter)

    const stats = {
      totalOrders: await Order.countDocuments({}),
      processedOrders: await Order.countDocuments({ orderStatus: { $in: ["shipped", "in-transit"] } }),
      deliveredOrders: await Order.countDocuments({ orderStatus: "delivered" }),
      inTransitOrders: await Order.countDocuments({ orderStatus: "in-transit" }),
      totalRevenue: await Order.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    }

    return NextResponse.json(
      {
        orders,
        pagination: {
          page,
          limit,
          total: totalOrders,
          pages: Math.ceil(totalOrders / limit),
        },
        stats: {
          totalOrders: stats.totalOrders,
          processedOrders: stats.processedOrders,
          deliveredOrders: stats.deliveredOrders,
          inTransitOrders: stats.inTransitOrders,
          totalRevenue: stats.totalRevenue[0]?.total || 0,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
