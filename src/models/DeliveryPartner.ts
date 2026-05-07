import mongoose from "mongoose"

const deliveryPartnerSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    shiprocketOrderId: {
      type: Number,
      required: true,
      unique: true,
    },
    shiprocketShipmentId: {
      type: Number,
    },
    courierCompanyId: {
      type: Number,
    },
    courierName: {
      type: String,
    },
    courierLogo: {
      type: String,
    },
    awbCode: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    // Delivery Partner Details
    deliveryPartnerName: {
      type: String,
      default: "Shiprocket Network",
    },
    deliveryPartnerPhone: {
      type: String,
    },
    deliveryPartnerLocation: {
      type: String,
    },
    // Status tracking
    shipmentStatus: {
      type: String,
      enum: [
        "pending",
        "booked",
        "manifest",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
        "lost",
      ],
      default: "pending",
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
    // Shiprocket raw response for debugging
    shiprocketResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    statusTimeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        description: String,
        location: String,
      },
    ],
  },
  { timestamps: true },
)

const DeliveryPartner =
  mongoose.models.DeliveryPartner ||
  mongoose.model("DeliveryPartner", deliveryPartnerSchema)

export default DeliveryPartner
