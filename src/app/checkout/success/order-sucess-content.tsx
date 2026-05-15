"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, ShoppingBag, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderLineItem } from "@/components/orders/order-line-item"
import { normalizeOrderLineItem, type OrderLineItemData } from "@/lib/order-item"

interface OrderSummary {
  orderId: string
  totalAmount: number
  items: OrderLineItemData[]
}

export function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(!!orderId)

  useEffect(() => {
    if (!orderId) {
      setLoadingOrder(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/track-order?orderId=${encodeURIComponent(orderId)}`)
        if (response.ok) {
          const data = await response.json()
          setOrder({
            orderId: data.orderId,
            totalAmount: Number(data.totalAmount) || 0,
            items: Array.isArray(data.items) ? data.items.map(normalizeOrderLineItem) : [],
          })
        }
      } catch (error) {
        console.error("Failed to load order summary:", error)
      } finally {
        setLoadingOrder(false)
      }
    }

    fetchOrder()
  }, [orderId])

  return (
    <main className="flex-1 py-12 md:py-24 px-4 md:px-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12 md:mb-16">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50" />
              <CheckCircle className="w-24 h-24 md:w-32 md:h-32 text-green-500 relative" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4 font-cormorant font-bold">
            Order Placed Successfully!
          </h1>

          <div className="space-y-3 text-stone-600">
            <p className="text-base md:text-lg leading-relaxed">
              Thank you for your order. We&apos;ve received it and will send you a confirmation email shortly.
            </p>
            {orderId && (
              <p className="text-sm md:text-base">
                Order ID: <span className="font-mono font-semibold text-foreground">{orderId}</span>
              </p>
            )}
          </div>

          <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 md:p-8 inline-block">
            <div className="space-y-2">
              <p className="text-sm md:text-base text-stone-600">
                <span className="font-semibold text-amber-700">Estimated Delivery:</span> 5-7 Business Days
              </p>
              <p className="text-sm md:text-base text-stone-600">
                <span className="font-semibold text-amber-700">Order Confirmation:</span> Check your email for details
              </p>
            </div>
          </div>
        </div>

        {loadingOrder ? (
          <p className="text-center text-stone-500 mb-8">Loading your order items...</p>
        ) : order?.items && order.items.length > 0 ? (
          <div className="mb-10 text-left border border-stone-200 rounded-xl p-4 md:p-6 bg-white shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Items in your order</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {order.items.map((item, index) => (
                <div key={index} className="pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                  <OrderLineItem item={item} thumbnailSize="md" showPrice />
                </div>
              ))}
            </div>
            <p className="mt-4 text-right font-semibold text-foreground">
              Total: ₹{order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
          <Button
            onClick={() => router.push(orderId ? `/track-order?orderId=${orderId}` : "/customer/orders")}
            className="flex-1 sm:flex-initial h-12 md:h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base md:text-lg rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Track Your Order</span>
          </Button>
          <Button
            onClick={() => router.push("/#shop")}
            className="flex-1 sm:flex-initial h-12 md:h-14 bg-white border-2 border-stone-300 hover:border-amber-500 text-foreground hover:text-amber-600 font-semibold text-base md:text-lg rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Continue Shopping</span>
          </Button>
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <p className="text-sm md:text-base text-stone-600 mb-3">Need help? We&apos;re here for you!</p>
          <div className="text-xs md:text-sm text-stone-500 space-y-1">
            <p>
              <strong>Email:</strong> qualprodsllp@gmail.com
            </p>
            <p>
              <strong>Phone:</strong> +91 9071799966
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
