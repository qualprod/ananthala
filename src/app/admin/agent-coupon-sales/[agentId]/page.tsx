"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface OrderRow {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  couponCode: string | null
  discount: number
  totalAmount: number
  createdAt: string
}

export default function AdminAgentCouponSalesDetailPage() {
  const params = useParams()
  const agentId = typeof params.agentId === "string" ? params.agentId : ""
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<{ fullname?: string; email?: string } | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!agentId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/agent-coupon-sales?agentId=${encodeURIComponent(agentId)}`, {
          credentials: "include",
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to load")
          return
        }
        setAgent(data.agent || null)
        setOrders(data.orders || [])
      } catch {
        setError("Failed to load")
      } finally {
        setLoading(false)
      }
    })()
  }, [agentId])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link
        href="/admin/agent-coupon-sales"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all agents
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Customers using this agent&apos;s coupon</h1>
        {agent && (
          <p className="text-foreground/70 mt-2">
            <span className="font-medium text-foreground">{agent.fullname}</span>
            {agent.email ? ` · ${agent.email}` : ""}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-foreground/70">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-foreground/70">No orders found for this agent.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Coupon</th>
                  <th className="px-4 py-3 font-semibold text-right">Discount</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId} className="border-t hover:bg-muted/30">
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
                    <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
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
    </div>
  )
}
