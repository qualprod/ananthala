"use client"

import { useState } from "react"
import { Package, Search, CheckCircle, Truck, MapPin, ArrowRight, Clock, MapPinIcon, DollarSign } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface TimelineEntry {
  status: string
  timestamp: string
  description: string
}

interface DeliveryPartnerInfo {
  courierName?: string
  courierLogo?: string
  awbCode?: string
  trackingUrl?: string
  deliveryPartnerName?: string
  deliveryPartnerPhone?: string
  deliveryPartnerLocation?: string
  shipmentStatus?: string
  lastStatusUpdate?: string
  statusTimeline?: Array<{
    status: string
    timestamp: string
    description: string
    location: string
  }>
}

interface Order {
  _id: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress?: {
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
  items: Array<{
    productName: string
    quantity: number
    price: number
    size?: string
    fabric?: string
    productColor?: string
  }>
  subtotal: number
  shippingCost: number
  discount: number
  totalAmount: number
  paymentStatus: "pending" | "completed" | "failed"
  orderStatus: "pending" | "processing" | "shipped" | "in-transit" | "delivered" | "cancelled"
  orderTimeline: TimelineEntry[]
  trackingNumber?: string
  handoverDate?: string
  courierName?: string
  awbCode?: string
  deliveryPartner?: DeliveryPartnerInfo
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  "in-transit": "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5" />,
  processing: <Package className="w-5 h-5" />,
  shipped: <Truck className="w-5 h-5" />,
  "in-transit": <Truck className="w-5 h-5" />,
  delivered: <CheckCircle className="w-5 h-5" />,
  cancelled: <MapPin className="w-5 h-5" />,
}

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast({
        description: "Please enter an Order ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(`/api/track-order?orderId=${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data)
      } else {
        setOrder(null)
        toast({
          description: data.error || "Order not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Track order error:", error)
      setOrder(null)
      toast({
        description: "Failed to track order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTrackAnother = () => {
    setSearchQuery("")
    setOrder(null)
    setSearched(false)
  }

  const getAddressLines = (address?: Order["shippingAddress"]) => {
    if (!address) return []
    const line1 = [address.houseNumber, address.crossStreet].filter(Boolean).join(", ")
    const line2 = [address.locality, address.landmark].filter(Boolean).join(", ")
    const line3 = [address.city, address.state, address.zipCode, address.country].filter(Boolean).join(", ")
    const fallback = [address.fullAddress, [address.city, address.state].filter(Boolean).join(", "), address.zipCode, address.country]
      .filter(Boolean)
      .join(", ")
    return [line1, line2, line3].filter(Boolean).length > 0 ? [line1, line2, line3].filter(Boolean) : fallback ? [fallback] : []
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 bg-[#FAFAF8]">
        {/* Header Section */}
        <div className="bg-white border-b border-[#E8DED6] py-4 sm:py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#6D4530]">Track Your Order</h1>
            <p className="text-sm sm:text-base text-[#8B5A3C] mt-2">Enter your Order ID to track your shipment in real-time</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
          {/* Search Section - Sticky on top */}
          <Card className="border border-[#D9CFC7] rounded-lg mb-6 sm:mb-8 sticky top-0 z-10 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleTrackOrder} className="space-y-3">
                <label className="block text-sm font-medium text-[#6D4530]">Order ID</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter Order ID (e.g., ORD-1773134921366-693)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-[#D9CFC7] focus:border-[#6D4530] focus:ring-[#6D4530] text-sm sm:text-base"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#6D4530] hover:bg-[#5A3A26] text-white whitespace-nowrap"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Searching..." : "Track"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searched && !order && !loading && (
            <Card className="border border-[#E8A897] bg-[#FFF5F3] rounded-lg">
              <CardContent className="p-6 sm:p-8 text-center">
                <MapPin className="w-10 sm:w-12 h-10 sm:h-12 text-[#D97B72] mx-auto mb-3" />
                <p className="text-base sm:text-lg font-medium text-[#8B5A3C]">Order not found</p>
                <p className="text-xs sm:text-sm text-[#8B5A3C]/70 mt-1">Please check your Order ID and try again</p>
              </CardContent>
            </Card>
          )}

          {order && (
            <div className="space-y-6">
              {/* Top Summary - Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Status & Timeline */}
                <div className="space-y-6">
                  {/* Order Status Card */}
                  <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl font-bold text-[#6D4530] mb-4">Order Status</h2>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Current Status</p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${statusColors[order.orderStatus]}`}
                            >
                              {statusIcons[order.orderStatus]}
                              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace("-", " ")}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-[#D9CFC7] pt-4">
                          <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Order ID</p>
                          <p className="text-base sm:text-lg font-mono font-bold text-[#6D4530] mt-1 break-all">{order.orderId}</p>
                        </div>
                        <div className="border-t border-[#D9CFC7] pt-4">
                          <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Order Date</p>
                          <p className="text-sm sm:text-base font-semibold text-[#6D4530] mt-1">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tracking Number Card */}
                  {order.trackingNumber && (
                    <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden bg-blue-50">
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-[#6D4530] mb-2">Tracking Number</h3>
                        <p className="font-mono text-base sm:text-lg font-semibold text-[#6D4530] break-all">{order.trackingNumber}</p>
                        <p className="text-xs sm:text-sm text-[#8B5A3C] mt-2">Use this number to track with the courier service</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Delivery Partner Card */}
                  {order.deliveryPartner && (order.orderStatus === "in-transit" || order.orderStatus === "delivered") && (
                    <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-[#6D4530] mb-4 flex items-center gap-2">
                          <Truck className="w-5 h-5 text-purple-600" />
                          Delivery Partner
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Courier Service</p>
                            <p className="text-base sm:text-lg font-semibold text-[#6D4530] mt-1">
                              {order.deliveryPartner.courierName || order.deliveryPartner.deliveryPartnerName || "Shiprocket"}
                            </p>
                          </div>

                          {order.deliveryPartner.awbCode && (
                            <div className="border-t border-[#D9CFC7] pt-3">
                              <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">AWB/Tracking Code</p>
                              <p className="font-mono text-base sm:text-lg font-semibold text-[#6D4530] mt-1 break-all">
                                {order.deliveryPartner.awbCode}
                              </p>
                            </div>
                          )}

                          {order.deliveryPartner.deliveryPartnerPhone && (
                            <div className="border-t border-[#D9CFC7] pt-3">
                              <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Delivery Contact</p>
                              <p className="text-base sm:text-lg font-semibold text-[#6D4530] mt-1">
                                {order.deliveryPartner.deliveryPartnerPhone}
                              </p>
                            </div>
                          )}

                          {order.deliveryPartner.deliveryPartnerLocation && (
                            <div className="border-t border-[#D9CFC7] pt-3">
                              <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Current Location</p>
                              <p className="text-base sm:text-lg font-semibold text-[#6D4530] mt-1">
                                {order.deliveryPartner.deliveryPartnerLocation}
                              </p>
                            </div>
                          )}

                          {order.handoverDate && (
                            <div className="border-t border-[#D9CFC7] pt-3">
                              <p className="text-xs sm:text-sm font-medium text-[#8B5A3C]">Handed Over Date</p>
                              <p className="text-base sm:text-lg font-semibold text-[#6D4530] mt-1">
                                {formatDate(order.handoverDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Delivery Timeline */}
                  <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl font-bold text-[#6D4530] mb-4">Delivery Timeline</h2>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {order.orderTimeline && order.orderTimeline.length > 0 ? (
                          order.orderTimeline.map((entry, index) => (
                            <div key={index} className="flex gap-3 last:pb-0">
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${statusColors[entry.status]} bg-white flex-shrink-0`}>
                                  {statusIcons[entry.status]}
                                </div>
                                {index < order.orderTimeline.length - 1 && (
                                  <div className="w-0.5 h-10 bg-[#D9CFC7] my-2"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 py-1">
                                <p className="font-semibold text-[#6D4530] text-sm sm:text-base capitalize break-words">
                                  {entry.status.replace("-", " ")}
                                </p>
                                <p className="text-xs sm:text-sm text-[#8B5A3C]/70 mt-1">{entry.timestamp}</p>
                                <p className="text-xs sm:text-sm text-[#6D4530] mt-1">{entry.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[#8B5A3C] text-sm">No timeline available yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Price Summary Card */}
                  <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl font-bold text-[#6D4530] mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Order Summary
                      </h2>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm sm:text-base text-[#6D4530]">
                          <span>Subtotal</span>
                          <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm sm:text-base text-green-600 font-semibold">
                            <span>Discount</span>
                            <span>-₹{order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm sm:text-base text-[#6D4530]">
                          <span>Shipping</span>
                          <span className="font-semibold">₹{order.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-[#D9CFC7] pt-3 mt-3 flex justify-between font-bold text-base sm:text-lg text-[#6D4530]">
                          <span>Total Amount</span>
                          <span>₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Items Ordered */}
                  {order.items && order.items.length > 0 && (
                    <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-bold text-[#6D4530] mb-4">Items Ordered ({order.items.length})</h2>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start p-3 bg-[#F5F1ED] rounded-lg gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#6D4530] text-sm sm:text-base break-words">{item.productName}</p>
                                <p className="text-xs sm:text-sm text-[#8B5A3C]/70 mt-1">Qty: {item.quantity}</p>
                                {(item.size || item.fabric || item.productColor) && (
                                  <p className="text-xs text-[#8B5A3C]/60 mt-1 break-words">
                                    {[item.size, item.fabric, item.productColor].filter(Boolean).join(" • ")}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold text-[#6D4530] text-sm sm:text-base flex-shrink-0">₹{item.price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <Card className="border border-[#D9CFC7] rounded-lg overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-bold text-[#6D4530] mb-4 flex items-center gap-2">
                          <MapPinIcon className="w-5 h-5" />
                          Delivery Address
                        </h2>
                        <div className="bg-[#F5F1ED] rounded-lg p-3 sm:p-4 text-sm">
                          {getAddressLines(order.shippingAddress).map((line, idx) => (
                            <p
                              key={`delivery-address-line-${idx}`}
                              className={idx === 0 ? "text-[#6D4530] font-medium" : "text-[#8B5A3C] mt-1"}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Track Another Order Button */}
              <div className="flex justify-center pt-4 md:pt-6">
                <Button
                  onClick={handleTrackAnother}
                  className="bg-[#6D4530] hover:bg-[#5A3A26] text-white px-6 sm:px-8 text-sm sm:text-base"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Track Another Order
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!searched && !order && (
            <Card className="border border-[#D9CFC7] rounded-lg">
              <CardContent className="p-8 sm:p-12 text-center">
                <Truck className="w-12 sm:w-16 h-12 sm:h-16 text-[#8B5A3C]/30 mx-auto mb-4" />
                <p className="text-base sm:text-lg font-medium text-[#8B5A3C]">Enter your Order ID above to track your order status</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
