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

    const normalizedItems = Array.isArray(order.items)
      ? order.items.map((item) => {
          const row =
            item && typeof (item as { toObject?: () => Record<string, unknown> }).toObject === "function"
              ? (item as { toObject: () => Record<string, unknown> }).toObject()
              : (item as Record<string, unknown>)

          return {
            productId: row.productId != null ? String(row.productId) : undefined,
            productName: row.productName != null ? String(row.productName) : "Product",
            productImage:
              typeof row.productImage === "string" && row.productImage && row.productImage !== "/placeholder.svg"
                ? row.productImage
                : undefined,
            productSlug: typeof row.productSlug === "string" ? row.productSlug : undefined,
            quantity: Number(row.quantity) || 1,
            price: Number(row.price) || 0,
            size: row.size != null ? String(row.size) : undefined,
            fabric: row.fabric != null ? String(row.fabric) : undefined,
            productColor: row.productColor != null ? String(row.productColor) : undefined,
          }
        })
      : []

    // Return order details without sensitive customer ID
    return NextResponse.json({
      _id: order._id,
      orderId: order.orderId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      items: normalizedItems,
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
