import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/order"
import DeliveryPartner from "@/models/DeliveryPartner"
import Product from "@/models/Product"
import { sendOrderStatusUpdateEmail } from "@/lib/email-service"
import shiprocketService from "@/lib/shiprocket-service"

// Helper function to reduce product stock when order is delivered
async function reduceProductStock(order: any) {
  try {
    console.log("[v0] Reducing stock for delivered order:", order.orderId)
    
    for (const item of order.items) {
      if (!item.productId) continue

      const product = await Product.findById(item.productId)
      if (!product) {
        console.warn(`[v0] Product not found for item in order ${order.orderId}:`, item.productId)
        continue
      }

      // Handle single products with variants (fabric-based)
      if (product.productType === "single") {
        const variant = product.variants.find(
          (v: any) => v.fabric === item.fabric
        )

        if (variant) {
          const newStock = Math.max(0, variant.stock - item.quantity)
          console.log(
            `[v0] Reducing ${product.productTitle} (${item.fabric}) stock from ${variant.stock} to ${newStock}`
          )

          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                "variants.$[elem].stock": -item.quantity,
              },
            },
            {
              arrayFilters: [{ "elem.fabric": item.fabric }],
              new: true,
            }
          )
        }
      }
      // Handle hamper products
      else if (product.productType === "hamper") {
        // For hampers, reduce stock from hamper items based on product color/variant
        // This assumes hamper items also have stock tracking
        const hamperItems = product.hamperItems || []
        
        for (const hamperItem of hamperItems) {
          // Find matching hamper item variant by checking available variants
          if (hamperItem.variants && hamperItem.variants.length > 0) {
            const firstVariant = hamperItem.variants[0]
            const newStock = Math.max(0, firstVariant.stock - item.quantity)
            
            console.log(
              `[v0] Reducing hamper item ${hamperItem.name} stock from ${firstVariant.stock} to ${newStock}`
            )

            // Update the first variant of the hamper item
            const itemIndex = hamperItems.indexOf(hamperItem)
            await Product.findByIdAndUpdate(
              item.productId,
              {
                $inc: {
                  [`hamperItems.${itemIndex}.variants.0.stock`]: -item.quantity,
                },
              },
              { new: true }
            )
          }
        }
      }
    }

    console.log("[v0] Stock reduction completed for order:", order.orderId)
  } catch (error) {
    console.error("[v0] Error reducing product stock:", error)
    // Don't fail the API call if stock reduction fails
    // This ensures order status update completes even if stock update has issues
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwtVerify(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const order = await Order.findById(id).lean()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error("Order details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwtVerify(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const { orderStatus, trackingNumber, notes, paymentStatus } = await request.json()

    // Validate orderStatus
    const validStatuses = ["pending", "processing", "shipped", "in-transit", "delivered", "cancelled"]
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (orderStatus) updateData.orderStatus = orderStatus
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (notes) updateData.notes = notes
    if (paymentStatus) updateData.paymentStatus = paymentStatus

    // Build timeline entry
    const timelineEntry = {
      status: orderStatus || "unknown",
      timestamp: new Date(),
      description: notes || `Order status updated to ${orderStatus}`,
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        ...updateData,
        $push: {
          orderTimeline: timelineEntry,
        },
      },
      { new: true },
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Handle Shiprocket integration when order status changes to "shipped"
    if (orderStatus === "shipped") {
      try {
        console.log(`[v0] [SHIPROCKET] Initiating shipment for order ${order.orderId}`)
        
        // Create Shiprocket order if not already created
        if (!order.shiprocketOrderId) {
          console.log(`[v0] [SHIPROCKET] Creating Shiprocket order for ${order.orderId}`)
          
          const shiprocketOrderPayload = {
            order_id: order.orderId,
            order_date: new Date(order.createdAt).toISOString().split("T")[0],
            billing_customer_name: order.customerName,
            billing_email: order.customerEmail,
            billing_phone: order.customerPhone,
            billing_address: order.billingAddress?.fullAddress || order.shippingAddress?.fullAddress || "NA",
            billing_city: order.billingAddress?.city || order.shippingAddress?.city || "NA",
            billing_state: order.billingAddress?.state || order.shippingAddress?.state || "NA",
            billing_country: order.billingAddress?.country || order.shippingAddress?.country || "India",
            billing_pincode: order.billingAddress?.zipCode || order.shippingAddress?.zipCode || "000000",
            shipping_is_bill: 0,
            shipping_customer_name: order.customerName,
            shipping_email: order.customerEmail,
            shipping_phone: order.customerPhone,
            shipping_address: order.shippingAddress?.fullAddress || "NA",
            shipping_city: order.shippingAddress?.city || "NA",
            shipping_state: order.shippingAddress?.state || "NA",
            shipping_country: order.shippingAddress?.country || "India",
            shipping_pincode: order.shippingAddress?.zipCode || "000000",
            order_items: order.items.map((item: any) => ({
              name: item.productName,
              sku: item.productId || "SKU-" + item.productName.substring(0, 3).toUpperCase(),
              units: item.quantity,
              selling_price: item.price,
            })),
            payment_method: order.paymentGateway === "razorpay" ? "Prepaid" : "COD",
            sub_total: order.subtotal,
            weight: process.env.SHIPROCKET_DEFAULT_WEIGHT ? parseFloat(process.env.SHIPROCKET_DEFAULT_WEIGHT) : 0.5,
          }
          
          const shiprocketResponse = await shiprocketService.createOrder(shiprocketOrderPayload)
          console.log(`[v0] [SHIPROCKET] Order creation response:`, shiprocketResponse)
          
          if (shiprocketResponse.order_id) {
            // Update order with Shiprocket ID
            await Order.findByIdAndUpdate(id, {
              shiprocketOrderId: shiprocketResponse.order_id,
            })
            
            console.log(`[v0] [SHIPROCKET] Created Shiprocket order ID: ${shiprocketResponse.order_id}`)
            
            // Create shipment
            try {
              console.log(`[v0] [SHIPROCKET] Creating shipment for Shiprocket order ${shiprocketResponse.order_id}`)
              const shipmentResponse = await shiprocketService.createShipment(shiprocketResponse.order_id)
              console.log(`[v0] [SHIPROCKET] Shipment creation response:`, shipmentResponse)
              
              if (shipmentResponse.shipment_id) {
                const shipmentId = shipmentResponse.shipment_id
                const awbCode = shipmentResponse.awb_code || shipmentResponse.tracking_number
                const courierName = shipmentResponse.courier_company_name || "Shiprocket Partner"
                
                console.log(`[v0] [SHIPROCKET] Shipment created - ID: ${shipmentId}, AWB: ${awbCode}, Courier: ${courierName}`)
                
                // Create DeliveryPartner record
                const deliveryPartner = new DeliveryPartner({
                  orderId: order._id,
                  shiprocketOrderId: shiprocketResponse.order_id,
                  shiprocketShipmentId: shipmentId,
                  awbCode: awbCode,
                  courierName: courierName,
                  shipmentStatus: "created",
                  statusTimeline: [
                    {
                      status: "created",
                      timestamp: new Date(),
                      description: "Shipment created in Shiprocket",
                      location: order.shippingAddress?.city || "NA",
                    },
                  ],
                })
                
                await deliveryPartner.save()
                console.log(`[v0] [SHIPROCKET] DeliveryPartner record created`)
                
                // Update Order with shipment details
                await Order.findByIdAndUpdate(id, {
                  awbCode: awbCode,
                  courierName: courierName,
                  handoverDate: new Date(),
                })
                
                console.log(`[v0] [SHIPROCKET] ✅ Shipment successfully created for order ${order.orderId}`)
              } else {
                console.error(`[v0] [SHIPROCKET] Shipment creation failed:`, shipmentResponse)
              }
            } catch (shipmentError) {
              console.error(`[v0] [SHIPROCKET] Shipment creation error:`, shipmentError)
              // Continue with order update even if shipment fails
            }
          } else {
            console.error(`[v0] [SHIPROCKET] Order creation failed:`, shiprocketResponse)
          }
        } else {
          console.log(`[v0] [SHIPROCKET] Shiprocket order already exists: ${order.shiprocketOrderId}`)
        }
      } catch (shiprocketError) {
        console.error(`[v0] [SHIPROCKET] Error during shipment process:`, shiprocketError)
        if (shiprocketError instanceof Error) {
          console.error(`[v0] [SHIPROCKET] Error message: ${shiprocketError.message}`)
          console.error(`[v0] [SHIPROCKET] Error stack: ${shiprocketError.stack}`)
        }
        // Don't fail the API call - order status update is still valid
      }
    }

    // Reduce product stock if order is being marked as delivered
    if (orderStatus === "delivered") {
      console.log("[v0] Order marked as delivered, reducing stock")
      await reduceProductStock(order)
    }

    // Send status update email if orderStatus was changed
    if (orderStatus) {
      try {
        console.log(`[v0] Sending status update email for order ${order.orderId}`)
        const emailSent = await sendOrderStatusUpdateEmail({
          orderId: order.orderId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          newStatus: orderStatus,
          trackingNumber: trackingNumber || order.trackingNumber || order.awbCode,
          notes: notes || undefined,
          totalAmount: order.totalAmount,
        })
        console.log(`[v0] Status update email ${emailSent ? "sent" : "failed to send"} for order ${order.orderId}`)
      } catch (emailError) {
        console.error(`[v0] Error sending status update email: ${emailError}`)
        // Don't fail the API call if email fails - order update is complete
      }
    }

    // Fetch updated order with fresh data
    const updatedOrder = await Order.findById(id)
    return NextResponse.json({ order: updatedOrder }, { status: 200 })
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
