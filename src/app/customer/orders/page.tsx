"use client"

import { useState, useEffect } from "react"
import { Package, Search, Eye, Truck, Clock, CheckCircle, AlertCircle, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  size?: string
  fabric?: string
  productColor?: string
}

interface TimelineEntry {
  status: string
  timestamp: string
  description: string
}

interface ShippingAddress {
  houseNumber?: string
  crossStreet?: string
  locality?: string
  landmark?: string
  fullAddress?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface Order {
  _id: string
  orderId: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress?: ShippingAddress
  orderStatus: "pending" | "processing" | "shipped" | "in-transit" | "delivered" | "cancelled"
  paymentStatus: "pending" | "completed" | "failed"
  totalAmount: number
  subtotal: number
  shippingCost: number
  discount: number
  items: OrderItem[]
  orderTimeline?: TimelineEntry[]
  trackingNumber?: string
  trackingUrl?: string
  shippingProvider?: string
  razorpayPaymentId?: string
  razorpayOrderId?: string
  paymentMethod?: string
  createdAt: string
  updatedAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [filterStatus, page])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (searchQuery) params.append("search", searchQuery)
      params.append("page", page.toString())

      const response = await fetch(`/api/customer/orders?${params}`, {
        credentials: "include",
      })

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchOrders()
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      shipped: "bg-purple-100 text-purple-700",
      "in-transit": "bg-orange-100 text-orange-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    }
    return statusMap[status] || "bg-gray-100 text-gray-700"
  }

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      pending: <Clock className="w-4 h-4" />,
      processing: <AlertCircle className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      "in-transit": <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />,
    }
    return iconMap[status] || <Package className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getAddressLines = (address?: ShippingAddress) => {
    if (!address) return []
    const line1 = [address.houseNumber, address.crossStreet].filter(Boolean).join(", ")
    const line2 = [address.locality, address.landmark].filter(Boolean).join(", ")
    const line3 = [address.city, address.state, address.zipCode, address.country].filter(Boolean).join(", ")
    const fallback = [address.fullAddress, [address.city, address.state].filter(Boolean).join(", "), address.zipCode, address.country]
      .filter(Boolean)
      .join(", ")
    return [line1, line2, line3].filter(Boolean).length > 0 ? [line1, line2, line3].filter(Boolean) : fallback ? [fallback] : []
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/customer/orders/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderId: selectedOrder._id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          description: "Order cancelled successfully",
        })
        setShowCancelConfirm(false)
        setIsDetailModalOpen(false)
        fetchOrders()
      } else {
        toast({
          description: data.error || "Failed to cancel order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Cancel order error:", error)
      toast({
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancelOrder = (order: Order) => {
    // Allow cancellation for pending and processing orders only
    // Cannot cancel if already cancelled, delivered, shipped, or in-transit
    const cancellableStatuses = ["pending", "processing"]
    return cancellableStatuses.includes(order.orderStatus)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-foreground mt-1">View and track your orders</p>
        </div>
        <Card className="border" style={{ borderColor: "#D9CFC7" }}>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-foreground mt-1">View and track your orders</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input
              placeholder="Search by Order ID..."
              className="pl-10 border-[#D9CFC7] focus-visible:ring-[#8B5A3C]/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="bg-[#8B5A3C] hover:bg-[#6D4530]">
            Search
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="border" style={{ borderColor: "#D9CFC7" }}>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-16 w-16 text-[#8B5A3C]/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-foreground mb-6">Start shopping to see your orders here</p>
              <a
                href="/"
                className="inline-block bg-[#EED9C4] text-foreground px-6 py-2 rounded-lg hover:bg-[#EED9C4]/80 transition-colors"
              >
                Start Shopping
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border" style={{ borderColor: "#D9CFC7" }}>
          <CardContent className="p-0">
            {/* Filter Row */}
            <div className="p-4 border-b" style={{ borderColor: "#D9CFC7" }}>
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Orders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F1ED]/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#6D4530]">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#6D4530]">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#6D4530]">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#6D4530]">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#6D4530]">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#6D4530]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#D9CFC7" }}>
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-[#F5F1ED]/30 transition-colors">
                      <td className="px-6 py-4">
                        <a href="#" className="text-[#8B5A3C] hover:underline font-medium">
                          {order.orderId}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">₹{order.totalAmount.toFixed(2)}</span>
                          {order.paymentStatus === "completed" && (
                            <span className="text-xs text-green-600">Payment Completed</span>
                          )}
                          {order.paymentStatus === "pending" && (
                            <span className="text-xs text-yellow-600">Awaiting Payment</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsDetailModalOpen(true)
                            }}
                            className="border-[#D9CFC7]"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsTrackingModalOpen(true)
                            }}
                            className="border-[#D9CFC7]"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Track
                          </Button>
                          {canCancelOrder(order) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowCancelConfirm(true)
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pr-0">
            <DialogTitle className="text-[#6D4530]">Order Details</DialogTitle>
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="text-foreground hover:text-[#6D4530]"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs text-[#8B5A3C]/70 font-medium">Order ID</p>
                  <p className="font-mono font-bold text-[#6D4530]">{selectedOrder.orderId}</p>
                </div>
                <div className="p-4 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs text-[#8B5A3C]/70 font-medium">Order Date</p>
                  <p className="font-bold text-[#6D4530]">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-3 p-4 bg-[#F5F1ED] rounded-lg border border-[#D9CFC7]">
                <h3 className="font-semibold text-[#6D4530]">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#8B5A3C]/70 font-medium">Name</p>
                    <p className="text-foreground">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[#8B5A3C]/70 font-medium">Phone</p>
                    <p className="text-foreground">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#8B5A3C]/70 font-medium">Email</p>
                    <p className="text-foreground">{selectedOrder.customerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="space-y-3 p-4 bg-[#F5F1ED] rounded-lg border border-[#D9CFC7]">
                  <h3 className="font-semibold text-[#6D4530]">Shipping Address</h3>
                  <div className="text-sm text-foreground space-y-1">
                    {getAddressLines(selectedOrder.shippingAddress).map((line, idx) => (
                      <p key={`shipping-line-${idx}`}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="space-y-3 p-4 bg-[#F5F1ED] rounded-lg border border-[#D9CFC7]">
                <h3 className="font-semibold text-[#6D4530]">Payment Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#8B5A3C]/70 font-medium">Method</p>
                    <p className="text-foreground capitalize">{selectedOrder.paymentMethod || "Razorpay"}</p>
                  </div>
                  <div>
                    <p className="text-[#8B5A3C]/70 font-medium">Payment Status</p>
                    <p className={`font-medium ${selectedOrder.paymentStatus === "completed" ? "text-green-600" : selectedOrder.paymentStatus === "pending" ? "text-yellow-600" : "text-red-600"}`}>
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                    </p>
                  </div>
                  {selectedOrder.razorpayPaymentId && (
                    <div className="col-span-2">
                      <p className="text-[#8B5A3C]/70 font-medium">Payment ID</p>
                      <p className="font-mono text-xs text-foreground break-all">{selectedOrder.razorpayPaymentId}</p>
                    </div>
                  )}
                  {selectedOrder.razorpayOrderId && (
                    <div className="col-span-2">
                      <p className="text-[#8B5A3C]/70 font-medium">Order Reference</p>
                      <p className="font-mono text-xs text-foreground break-all">{selectedOrder.razorpayOrderId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#6D4530]">Items Ordered</h3>
                <div className="border" style={{ borderColor: "#D9CFC7" }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 border-b" style={{ borderColor: "#D9CFC7" }}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-medium text-[#6D4530]">{item.productName}</p>
                          <div className="text-sm text-foreground mt-1 space-y-1">
                            {item.size && <p>Size: {item.size}</p>}
                            {item.fabric && <p>Fabric: {item.fabric}</p>}
                            {item.productColor && <p>Color: {item.productColor}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#6D4530]">₹{item.price.toFixed(2)}</p>
                          <p className="text-sm text-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-[#8B5A3C]">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 p-4 bg-[#F5F1ED] rounded-lg">
                <div className="flex justify-between">
                  <span className="text-foreground">Subtotal:</span>
                  <span className="font-medium">₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-foreground">Shipping:</span>
                    <span className="font-medium">₹{selectedOrder.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-₹{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: "#D9CFC7" }}>
                  <span className="font-bold text-[#6D4530]">Total:</span>
                  <span className="font-bold text-[#6D4530]">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Status and Tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs text-[#8B5A3C]/70 font-medium">Order Status</p>
                  <div className={`inline-flex items-center gap-2 mt-2 px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {getStatusIcon(selectedOrder.orderStatus)}
                    {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
                  </div>
                </div>
                <div className="p-4 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs text-[#8B5A3C]/70 font-medium">Payment Status</p>
                  <p className={`text-sm font-medium mt-2 ${selectedOrder.paymentStatus === "completed" ? "text-green-600" : selectedOrder.paymentStatus === "pending" ? "text-yellow-600" : "text-red-600"}`}>
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                  </p>
                </div>
              </div>

              {selectedOrder.trackingNumber && (
                <div className="p-4 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs text-[#8B5A3C]/70 font-medium">Tracking Number</p>
                  <p className="font-mono font-bold text-[#6D4530] mt-1">{selectedOrder.trackingNumber}</p>
                </div>
              )}

              {/* Cancel Order Button */}
              {canCancelOrder(selectedOrder) && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isCancelling}
                    className="w-full"
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Order"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone. Your payment will be refunded within 5-7 business days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-3 rounded-lg my-4">
            <p className="text-sm font-medium">Order ID: <span className="font-mono">{selectedOrder?.orderId}</span></p>
            <p className="text-sm text-gray-600 mt-1">Total Amount: ₹{selectedOrder?.totalAmount.toFixed(2)}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Tracking Modal */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#6D4530]">Order Tracking</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order ID and Tracking Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs text-[#8B5A3C]/70 font-medium">Order ID</p>
                  <p className="font-mono font-bold text-[#6D4530] mt-1">{selectedOrder.orderId}</p>
                </div>
                {selectedOrder.trackingNumber && (
                  <div className="p-4 bg-[#F5F1ED] rounded-lg">
                    <p className="text-xs text-[#8B5A3C]/70 font-medium">Tracking Number</p>
                    <p className="font-mono font-bold text-[#6D4530] mt-1">{selectedOrder.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Current Status */}
              <div className="p-4 bg-[#F5F1ED] rounded-lg">
                <p className="text-xs text-[#8B5A3C]/70 font-medium mb-3">Current Status</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.orderStatus)}`}>
                  {getStatusIcon(selectedOrder.orderStatus)}
                  {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
                </div>
              </div>

              {/* Tracking URL Button */}
              {selectedOrder.trackingUrl && (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-3">Track Your Shipment</p>
                  <Button
                    onClick={() => {
                      window.open(selectedOrder.trackingUrl, "_blank")
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Open Tracking ({selectedOrder.shippingProvider || "Logistics Provider"})
                  </Button>
                </div>
              )}

              {/* Timeline Tracking */}
              {selectedOrder.orderTimeline && selectedOrder.orderTimeline.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#6D4530]">Order Progress</h3>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8B5A3C] to-[#D9CFC7]"></div>

                    {/* Timeline Items */}
                    <div className="space-y-6 relative">
                      {selectedOrder.orderTimeline.map((entry, index) => {
                        const isCompleted = index < selectedOrder.orderTimeline!.length
                        const isCurrent = index === selectedOrder.orderTimeline!.length - 1

                        return (
                          <div key={index} className="flex gap-4 ml-4">
                            {/* Timeline Dot */}
                            <div className="relative flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isCurrent
                                    ? "border-[#8B5A3C] bg-[#8B5A3C]"
                                    : "border-[#8B5A3C] bg-white"
                                }`}
                              >
                                {isCurrent && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                            </div>

                            {/* Timeline Content */}
                            <div className="pt-1 pb-4">
                              <div className={`font-semibold ${isCurrent ? "text-[#6D4530]" : "text-[#8B5A3C]"}`}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                              </div>
                              <p className="text-sm text-foreground mt-1">{entry.description}</p>
                              <p className="text-xs text-[#8B5A3C]/60 mt-2">
                                {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#F5F1ED] rounded-lg text-center">
                  <p className="text-foreground">No tracking information available yet.</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-3 border-t pt-4" style={{ borderColor: "#D9CFC7" }}>
                <div className="flex justify-between">
                  <span className="text-foreground">Order Date:</span>
                  <span className="font-medium text-[#6D4530]">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Last Updated:</span>
                  <span className="font-medium text-[#6D4530]">{formatDate(selectedOrder.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
