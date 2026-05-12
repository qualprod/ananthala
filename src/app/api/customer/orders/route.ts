import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { jwtVerify } from "@/lib/jwt"
import connectDB from "@/lib/mongodb"
import Order from "@/models/order"

export async function GET(request: NextRequest) {
  try {
    // Get authentication token
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        {
          orders: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        },
        { status: 200 }
      )
    }

    const decoded = jwtVerify(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        {
          orders: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        },
        { status: 200 }
      )
    }

    // Convert userId string to MongoDB ObjectId for proper querying
    let customerObjectId: mongoose.Types.ObjectId
    try {
      customerObjectId = new mongoose.Types.ObjectId(decoded.userId)
    } catch (e) {
      console.error("[CUSTOMER_ORDERS_ERROR] Invalid customer ID format:", decoded.userId)
      return NextResponse.json(
        {
          orders: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        },
        { status: 200 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 10

    const skip = (page - 1) * limit

    // Build filter for customer orders using ObjectId
    const filter: Record<string, unknown> = {
      customerId: customerObjectId,
    }

    if (status && status !== "all") {
      filter.orderStatus = status
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
      ]
    }

    const orders = await Order.find(filter)
      .select(
        "orderId customerId customerName customerEmail customerPhone orderStatus paymentStatus totalAmount subtotal shippingCost discount items orderTimeline createdAt updatedAt trackingNumber shippingAddress",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalOrders = await Order.countDocuments(filter)

    // Calculate order statistics for this customer
    const stats = {
      totalOrders: await Order.countDocuments({ customerId: customerObjectId }),
      pendingOrders: await Order.countDocuments({ customerId: customerObjectId, orderStatus: "pending" }),
      processingOrders: await Order.countDocuments({ customerId: customerObjectId, orderStatus: "processing" }),
      shippedOrders: await Order.countDocuments({ customerId: customerObjectId, orderStatus: { $in: ["shipped", "in-transit"] } }),
      deliveredOrders: await Order.countDocuments({ customerId: customerObjectId, orderStatus: "delivered" }),
      totalSpent: await Order.aggregate([
        { $match: { customerId: customerObjectId, paymentStatus: "completed" } },
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
          pendingOrders: stats.pendingOrders,
          processingOrders: stats.processingOrders,
          shippedOrders: stats.shippedOrders,
          deliveredOrders: stats.deliveredOrders,
          totalSpent: stats.totalSpent[0]?.total || 0,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Customer orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
