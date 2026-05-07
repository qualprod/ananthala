import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/order"
import DeliveryPartner from "@/models/DeliveryPartner"
import shiprocketService from "@/lib/shiprocket-service"

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

    const { awbCode } = await request.json()

    if (!awbCode) {
      return NextResponse.json(
        { error: "AWB Code is required" },
        { status: 400 }
      )
    }

    // Fetch tracking data from Shiprocket
    const trackingData = await shiprocketService.getTrackingInfo(awbCode)

    if (trackingData.error) {
      return NextResponse.json(
        { error: trackingData.error },
        { status: 400 }
      )
    }

    const shipmentData = trackingData.tracking_data
    if (!shipmentData) {
      return NextResponse.json(
        { error: "No tracking data found" },
        { status: 404 }
      )
    }

    // Find delivery partner by AWB code
    let deliveryPartner = await DeliveryPartner.findOne({
      awbCode: awbCode,
    }).populate("orderId")

    if (!deliveryPartner) {
      // Try to find by order ID if exists in shiprocket
      const order = await Order.findOne({
        shiprocketOrderId: shipmentData.order_id,
      })
      if (order) {
        deliveryPartner = await DeliveryPartner.findOne({
          orderId: order._id,
        })
      }
    }

    if (!deliveryPartner) {
      return NextResponse.json(
        { error: "Delivery partner record not found" },
        { status: 404 }
      )
    }

    // Update delivery partner with latest tracking info
    deliveryPartner.shipmentStatus = mapShiprocketStatus(
      shipmentData.status
    )
    deliveryPartner.lastStatusUpdate = new Date()

    if (!deliveryPartner.statusTimeline) {
      deliveryPartner.statusTimeline = []
    }

    // Add status updates from Shiprocket
    if (shipmentData.status_updates && Array.isArray(shipmentData.status_updates)) {
      for (const update of shipmentData.status_updates) {
        const existingUpdate = deliveryPartner.statusTimeline.find(
          (t) =>
            t.status === update.status &&
            t.timestamp?.toISOString() ===
              new Date(update.status_date).toISOString()
        )

        if (!existingUpdate) {
          deliveryPartner.statusTimeline.push({
            status: update.status,
            timestamp: new Date(update.status_date),
            description: update.remarks || `Shipment ${update.status}`,
            location: update.location || "",
          })
        }
      }
    }

    await deliveryPartner.save()

    // Update order status
    const order = await Order.findById(deliveryPartner.orderId)
    if (order) {
      const newOrderStatus = mapShiprocketStatus(
        shipmentData.status
      )

      if (order.orderStatus !== newOrderStatus) {
        order.orderStatus = newOrderStatus

        if (!order.orderTimeline) {
          order.orderTimeline = []
        }

        const statusDescriptions: Record<string, string> = {
          in_transit:
            "Your order has been handed over to delivery partner and is in transit",
          out_for_delivery:
            "Your order is out for delivery today",
          delivered: "Your order has been delivered successfully",
          booked: "Your order has been booked with courier",
          manifest:
            "Your order has been manifested and is ready to ship",
          cancelled: "Your order has been cancelled",
        }

        order.orderTimeline.push({
          status: newOrderStatus,
          timestamp: new Date(),
          description:
            statusDescriptions[shipmentData.status] ||
            `Order status updated to ${shipmentData.status}`,
        })

        // Update handover date when transitioning to in-transit
        if (
          newOrderStatus === "in-transit" &&
          !order.handoverDate
        ) {
          order.handoverDate = new Date()
        }

        await order.save()
      }
    }

    return NextResponse.json(
      {
        success: true,
        deliveryPartner,
        shipmentStatus: shipmentData.status,
        message: "Tracking information synced successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Shiprocket Sync] Error:", error)
    return NextResponse.json(
      { error: "Failed to sync tracking information" },
      { status: 500 }
    )
  }
}
