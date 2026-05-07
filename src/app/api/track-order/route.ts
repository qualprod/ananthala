import { connectDB } from "@/lib/mongodb"
import Order from "@/models/order"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const order = await Order.findOne({ orderId: orderId.toUpperCase().trim() })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Return order details without sensitive customer ID
    return NextResponse.json({
      _id: order._id,
      orderId: order.orderId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      orderTimeline: order.orderTimeline || [],
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })
  } catch (error) {
    console.error("Track order error:", error)
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 })
  }
}
