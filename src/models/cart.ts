import mongoose from "mongoose"

const complementaryItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      default: 0,
      description: "Should always be 0 for free items",
    },
  },
  { _id: true }
)

const cartItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
      required: false,
    },
    fabric: {
      type: String,
      required: false,
    },
    productColor: {
      type: String,
      required: false,
      description: "Color name selected from color configurator",
    },
    productColorHex: {
      type: String,
      required: false,
      description: "HEX value of the selected color",
    },
    complementaryItems: {
      type: [complementaryItemSchema],
      default: [],
      description: "Free products included with this cart item",
    },
  },
  { _id: true, timestamps: true }
)

const cartSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userEmail: {
      type: String,
      required: false,
    },
    userName: {
      type: String,
      required: false,
    },
    userPhone: {
      type: String,
      required: false,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    appliedCoupons: [
      {
        code: {
          type: String,
          required: true,
        },
        discountAmount: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ["percentage", "fixed"],
          required: true,
        },
        discount: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "abandoned", "converted_to_order"],
      default: "active",
    },
    sessionId: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    cartVersion: {
      type: Number,
      default: 1,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  { timestamps: true }
)

// Auto-delete carts after expiration
cartSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema)

export default Cart
