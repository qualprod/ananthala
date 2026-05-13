"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"

interface PeriodMetrics {
  orderCount: number
  grossOrderTotal: number
  netPaid: number
  discountTotal: number
}

interface AgentRow {
  agentId: string
  agentName: string
  agentEmail: string
  thisMonth: PeriodMetrics
  ytd: PeriodMetrics
  allTime: PeriodMetrics
}

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}

function PeriodCell({ p }: { p: PeriodMetrics }) {
  return (
    <div className="text-xs text-right space-y-0.5 tabular-nums">
      <div>
        <span className="text-foreground/55">Gross</span>{" "}
        <span className="font-medium text-foreground">{formatInr(p.grossOrderTotal)}</span>
      </div>
      <div>
        <span className="text-foreground/55">Net</span>{" "}
        <span className="font-medium text-foreground">{formatInr(p.netPaid)}</span>
      </div>
      <div>
        <span className="text-foreground/55">Discount</span>{" "}
        <span className="font-medium text-green-700">{formatInr(p.discountTotal)}</span>
      </div>
      <div className="text-foreground/50 pt-0.5">{p.orderCount} orders</div>
    </div>
  )
}

export default function AdminAgentCouponSalesPage() {
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [error, setError] = useState("")
  const [periodNote, setPeriodNote] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/admin/agent-coupon-sales", { credentials: "include" })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to load")
          return
        }
        setAgents((data.agents || []) as AgentRow[])
        if (data.periods?.timezone) {
          setPeriodNote(
            `This month and YTD use the calendar in ${data.periods.timezone} (India).`,
          )
        }
      } catch {
        setError("Failed to load sales")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7" />
          Agent coupon sales
        </h1>
        <p className="text-foreground/70 mt-2 max-w-3xl">
          Orders paid with an agent&apos;s coupon code. For each period you see:{" "}
          <strong>Gross</strong> — sum of cart subtotals before the coupon;{" "}
          <strong>Net</strong> — sum of amounts actually collected (after discount and shipping);{" "}
          <strong>Discount</strong> — sum of coupon discounts applied.
        </p>
        {periodNote && <p className="text-sm text-foreground/60 mt-1">{periodNote}</p>}
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
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap min-w-36">
                    This month
                    <div className="text-[10px] font-normal text-foreground/55 mt-0.5">
                      Gross · Net · Discount
                    </div>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap min-w-36">
                    YTD
                    <div className="text-[10px] font-normal text-foreground/55 mt-0.5">
                      Gross · Net · Discount
                    </div>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap min-w-36">
                    All-time
                    <div className="text-[10px] font-normal text-foreground/55 mt-0.5">
                      Gross · Net · Discount
                    </div>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Customers</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agentId} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium align-top">{a.agentName}</td>
                    <td className="px-4 py-3 text-foreground/80 align-top">{a.agentEmail}</td>
                    <td className="px-4 py-3 align-top">
                      <PeriodCell p={a.thisMonth} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <PeriodCell p={a.ytd} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <PeriodCell p={a.allTime} />
                    </td>
                    <td className="px-4 py-3 text-right align-top">
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
