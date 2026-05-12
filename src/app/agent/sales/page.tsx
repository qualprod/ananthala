"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IndianRupee, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SaleRow {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  couponCode: string | null
  subtotal: number
  discount: number
  totalAmount: number
  createdAt: string
  orderStatus: string
}

export default function AgentCouponSalesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ orderCount: 0, revenue: 0, discountGiven: 0 })
  const [orders, setOrders] = useState<SaleRow[]>([])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/agent/coupon-sales", { credentials: "include" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        router.replace("/agent")
        return
      }
      setSummary(data.summary)
      setOrders(data.orders || [])
    } catch {
      router.replace("/agent")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [router])

  return (
    <div className="min-h-screen bg-[#F5F1ED]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-[#6D4530]">Coupon sales</h1>
            <p className="text-[#8B5A3C] mt-1">
              Completed orders where customers used your assigned coupon code.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-[#D9CFC7]"
            onClick={() => load()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-[#E5D5C5] p-6 shadow-sm">
            <p className="text-sm text-[#8B5A3C]/70">Orders</p>
            <p className="text-2xl font-bold text-[#6D4530] mt-1">{summary.orderCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E5D5C5] p-6 shadow-sm">
            <p className="text-sm text-[#8B5A3C]/70">Revenue (paid)</p>
            <p className="text-2xl font-bold text-[#6D4530] mt-1 flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {summary.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-[#E5D5C5] p-6 shadow-sm">
            <p className="text-sm text-[#8B5A3C]/70">Discount you offered</p>
            <p className="text-2xl font-bold text-[#6D4530] mt-1 flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {summary.discountGiven.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5D5C5] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-[#8B5A3C]">Loading sales…</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-[#8B5A3C]/80">
              No sales yet from your coupon codes. Share your code with customers to see orders here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F1ED] text-left text-[#6D4530]">
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold text-right">Discount</th>
                    <th className="px-4 py-3 font-semibold text-right">Paid</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId} className="border-t border-[#E5D5C5] hover:bg-[#F5F1ED]/50">
                      <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                      <td className="px-4 py-3">{o.customerName}</td>
                      <td className="px-4 py-3">{o.customerEmail}</td>
                      <td className="px-4 py-3">{o.customerPhone}</td>
                      <td className="px-4 py-3 font-mono">{o.couponCode || "—"}</td>
                      <td className="px-4 py-3 text-right text-green-700">
                        ₹{o.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{o.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-[#8B5A3C] whitespace-nowrap">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
