import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/order"
import DeliveryPartner from "@/models/DeliveryPartner"

// Map Shiprocket status to order status
const mapShiprocketStatus = (
  status: string
): "pending" | "processing" | "shipped" | "in-transit" | "delivered" | "cancelled" => {
  const statusMap: Record<string, "pending" | "processing" | "shipped" | "in-transit" | "delivered" | "cancelled"> = {
    pending: "pending",
    booked: "processing",
    manifest: "shipped",
    in_transit: "in-transit",
    out_for_delivery: "in-transit",
    delivered: "delivered",
    cancelled: "cancelled",
    returned: "cancelled",
    lost: "cancelled",
  }
  return statusMap[status] || "pending"
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()

    console.log("[Shiprocket Webhook] Received:", JSON.stringify(body, null, 2))

    // Validate webhook signature (if Shiprocket sends one)
    // You can add signature validation here using the webhook secret

    const {
      tracking_data,
      event_type,
      order_id,
      shipment_id,
      awb_code,
      status,
      status_date,
      location,
      remarks,
    } = body

    if (!tracking_data && !order_id) {
      return NextResponse.json(
        { error: "Missing order information" },
        { status: 400 }
      )
    }

    const shiprocketOrderId =
      tracking_data?.order_id || order_id

    // Find order by Shiprocket order ID
    const order = await Order.findOne({
      shiprocketOrderId: shiprocketOrderId,
    })

    if (!order) {
      console.warn(
        `[Shiprocket Webhook] Order not found for Shiprocket Order ID: ${shiprocketOrderId}`
      )
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Find or create delivery partner record
    let deliveryPartner = await DeliveryPartner.findOne({
      orderId: order._id,
    })

    const shiprocketShipmentId =
      tracking_data?.shipment_id || shipment_id
    const awbCodeValue = tracking_data?.awb_code || awb_code
    const currentStatus =
      tracking_data?.status || status || "in_transit"

    if (!deliveryPartner && shiprocketShipmentId) {
      deliveryPartner = await DeliveryPartner.create({
        orderId: order._id,
        shiprocketOrderId: shiprocketOrderId,
        shiprocketShipmentId: shiprocketShipmentId,
        awbCode: awbCodeValue,
        shipmentStatus: mapShiprocketStatus(currentStatus),
      })
    }

    if (deliveryPartner) {
      // Update delivery partner status
      deliveryPartner.shipmentStatus = mapShiprocketStatus(
        currentStatus
      )
      deliveryPartner.lastStatusUpdate = new Date(
        status_date || Date.now()
      )

      // Add to status timeline
      if (
        !deliveryPartner.statusTimeline
      ) {
        deliveryPartner.statusTimeline = []
      }

      deliveryPartner.statusTimeline.push({
        status: currentStatus,
        timestamp: new Date(status_date || Date.now()),
        description: remarks || `Order ${currentStatus}`,
        location: location || "",
      })

      await deliveryPartner.save()
    }

    // Update order status based on Shiprocket status
    const newOrderStatus = mapShiprocketStatus(currentStatus)

    if (order.orderStatus !== newOrderStatus) {
      order.orderStatus = newOrderStatus

      // Add to order timeline
      if (!order.orderTimeline) {
        order.orderTimeline = []
      }

      const statusDescriptions: Record<string, string> = {
        in_transit: "Your order is on its way to you",
        out_for_delivery: "Your order is out for delivery",
        delivered: "Your order has been delivered",
        in_transit:
          "Your order has been handed over to delivery partner",
        booked: "Your order has been processed and is ready to ship",
        manifest: "Your order has been shipped",
      }

      order.orderTimeline.push({
        status: newOrderStatus,
        timestamp: new Date(status_date || Date.now()),
        description:
          statusDescriptions[currentStatus] ||
          `Order status updated to ${currentStatus}`,
      })

      // Update handover date when transitioning to in-transit
      if (
        newOrderStatus === "in-transit" &&
        order.orderStatus !== "in-transit"
      ) {
        order.handoverDate = new Date(status_date || Date.now())
      }

      await order.save()
    }

    console.log(
      `[Shiprocket Webhook] Successfully processed order: ${order.orderId}`
    )

    return NextResponse.json(
      { success: true, message: "Webhook processed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Shiprocket Webhook] Error:", error)
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    )
  }
}

// Verify webhook endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get("challenge")

  if (challenge) {
    return NextResponse.json({ challenge }, { status: 200 })
  }

  return NextResponse.json(
    { message: "Webhook endpoint is active" },
    { status: 200 }
  )
}
