"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"

interface AgentRow {
  agentId: string
  agentName: string
  agentEmail: string
  orderCount: number
  revenue: number
  discountGiven: number
}

export default function AdminAgentCouponSalesPage() {
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/admin/agent-coupon-sales", { credentials: "include" })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to load")
          return
        }
        setAgents(data.agents || [])
      } catch {
        setError("Failed to load sales")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7" />
          Agent coupon sales
        </h1>
        <p className="text-foreground/70 mt-2">
          Revenue from orders where customers paid using an agent-only coupon. Open an agent to see customer details.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-foreground/70">Loading…</div>
        ) : agents.length === 0 ? (
          <div className="p-10 text-center text-foreground/70">
            No agent-attributed coupon orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold text-right">Orders</th>
                  <th className="px-4 py-3 font-semibold text-right">Discount given</th>
                  <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                  <th className="px-4 py-3 font-semibold text-right">Customers</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agentId} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{a.agentName}</td>
                    <td className="px-4 py-3 text-foreground/80">{a.agentEmail}</td>
                    <td className="px-4 py-3 text-right">{a.orderCount}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      ₹{a.discountGiven.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{a.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/agent-coupon-sales/${a.agentId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        View list
                      </Link>
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
