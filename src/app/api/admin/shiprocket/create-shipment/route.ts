import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/order"
import DeliveryPartner from "@/models/DeliveryPartner"
import shiprocketService from "@/lib/shiprocket-service"

/**
 * Create Shiprocket shipment for an order
 * POST /api/admin/shiprocket/create-shipment
 * 
 * Request body:
 * {
 *   "orderId": "ORD-1234567890-123"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Find order
    const order = await Order.findOne({ orderId })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Check if order is in shipped status
    if (order.orderStatus !== "shipped" && order.orderStatus !== "processing") {
      return NextResponse.json(
        {
          error: `Order must be in shipped or processing status. Current status: ${order.orderStatus}`,
        },
        { status: 400 }
      )
    }

    // Check if already has Shiprocket order
    if (order.shiprocketOrderId) {
      return NextResponse.json(
        {
          error: "Order already has Shiprocket shipment",
          shiprocketOrderId: order.shiprocketOrderId,
        },
        { status: 400 }
      )
    }

    // Prepare Shiprocket order payload
    const payload = {
      order_id: order.orderId,
      order_date: order.createdAt.toISOString(),
      billing_customer_name: order.customerName,
      billing_email: order.customerEmail,
      billing_phone: order.customerPhone,
      billing_address:
        order.billingAddress?.fullAddress ||
        order.shippingAddress?.fullAddress ||
        "N/A",
      billing_city:
        order.billingAddress?.city || order.shippingAddress?.city || "N/A",
      billing_state:
        order.billingAddress?.state || order.shippingAddress?.state || "N/A",
      billing_country:
        order.billingAddress?.country ||
        order.shippingAddress?.country ||
        "India",
      billing_pincode:
        order.billingAddress?.zipCode ||
        order.shippingAddress?.zipCode ||
        "000000",
      shipping_is_bill: 1,
      shipping_customer_name: order.customerName,
      shipping_email: order.customerEmail,
      shipping_phone: order.customerPhone,
      shipping_address: order.shippingAddress?.fullAddress || "N/A",
      shipping_city: order.shippingAddress?.city || "N/A",
      shipping_state: order.shippingAddress?.state || "N/A",
      shipping_country: order.shippingAddress?.country || "India",
      shipping_pincode: order.shippingAddress?.zipCode || "000000",
      order_items: order.items.map((item) => ({
        name: item.productName,
        sku: item.productId?.toString() || `SKU-${item.productName}`,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.paymentMethod || "prepaid",
      sub_total: order.subtotal,
      weight: process.env.SHIPROCKET_DEFAULT_WEIGHT
        ? parseFloat(process.env.SHIPROCKET_DEFAULT_WEIGHT)
        : 0.5,
    }

    console.log("[Admin Shipment] Creating Shiprocket order:", payload)

    // Create order in Shiprocket
    const shiprocketOrder = await shiprocketService.createOrder(payload)

    if (!shiprocketOrder.order_id) {
      return NextResponse.json(
        {
          error: "Failed to create Shiprocket order",
          details: shiprocketOrder.message || "Unknown error",
        },
        { status: 400 }
      )
    }

    // Save Shiprocket order ID to order
    order.shiprocketOrderId = shiprocketOrder.order_id
    await order.save()

    console.log(
      `[Admin Shipment] Shiprocket order created: ${shiprocketOrder.order_id}`
    )

    // Create shipment
    const shipment = await shiprocketService.createShipment(
      shiprocketOrder.order_id
    )

    console.log(
      `[Admin Shipment] Shipment created: ${shipment.shipment_id || "pending"}`
    )

    // Create delivery partner record
    const deliveryPartner = await DeliveryPartner.create({
      orderId: order._id,
      shiprocketOrderId: shiprocketOrder.order_id,
      shiprocketShipmentId: shipment.shipment_id,
      shiprocketResponse: shiprocketOrder,
    })

    console.log(
      `[Admin Shipment] Delivery partner record created: ${deliveryPartner._id}`
    )

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully",
        data: {
          orderId: order.orderId,
          shiprocketOrderId: shiprocketOrder.order_id,
          shipmentId: shipment.shipment_id,
          deliveryPartnerId: deliveryPartner._id,
          courierName: shipment.courier_name,
          awbCode: shipment.awb_code,
          trackingUrl: shipment.tracking_url,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Admin Shipment] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to create shipment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
