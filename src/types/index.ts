export interface Product {
  id: string
  name: string
  category: string
  price: number
  features: string[]
  image: string
}

export interface Review {
  id: string
  name: string
  rating: number
  text: string
}

export interface Feature {
  icon: string
  title: string
  description: string
}

export interface ShippingAddress {
  houseNumber?: string
  crossStreet?: string
  landmark?: string
  locality?: string
  fullAddress?: string
  city?: string
  state?: string
  zipCode?: string
  pincode?: string
  country?: string
}

export interface OrderItem {
  productId?: string
  productName: string
  productImage?: string
  productSlug?: string
  quantity: number
  price: number
  size?: string
  fabric?: string
  productColor?: string
  productColorHex?: string
}

export interface Order {
  _id?: string
  orderId: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress?: ShippingAddress
  orderStatus: "pending" | "processing" | "shipped" | "in-transit" | "delivered" | "cancelled" | "payment_failed"
  paymentStatus: "pending" | "completed" | "failed"
  totalAmount: number
  subtotal: number
  shippingCost?: number
  discount?: number
  items: OrderItem[]
  trackingNumber?: string
  trackingUrl?: string
  shippingProvider?: string
  razorpayPaymentId?: string
  razorpayOrderId?: string
  paymentMethod?: string
  appliedCoupons?: string
  createdAt?: string
  updatedAt?: string
}
