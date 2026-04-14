"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Users, Package, Layers } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Line, LineChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AnalyticsData {
  stats: {
    totalUsers: number
    totalProducts: number
    totalStock: number
    userGrowthPercentage: string
    productGrowthPercentage: string
    usersByRole: {
      customer: number
      admin: number
      agent: number
    }
  }
  charts: {
    userGrowth: Array<{ month: string; users: number }>
    productsByCategory: Array<{ category: string; count: number }>
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<"jan-jun" | "jul-dec">("jul-dec")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      } else {
        setError(result.message || "Failed to fetch analytics")
      }
    } catch (err: any) {
      setError("Failed to load analytics data")
      console.error("Analytics fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8B5A3C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading analytics</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: "Total Users",
      value: analytics.stats.totalUsers.toString(),
      change: analytics.stats.userGrowthPercentage,
      icon: Users,
      color: "from-purple-500 to-pink-500",
      subtext: `${analytics.stats.usersByRole.customer} customers, ${analytics.stats.usersByRole.admin} admins, ${analytics.stats.usersByRole.agent} agents`,
    },
    {
      label: "Total Products",
      value: analytics.stats.totalProducts.toString(),
      change: analytics.stats.productGrowthPercentage,
      icon: Package,
      color: "from-orange-500 to-red-500",
      subtext: "Active product listings",
    },
    {
      label: "Total Stock",
      value: analytics.stats.totalStock.toString(),
      change: "+0.0%",
      icon: Layers,
      color: "from-blue-500 to-cyan-500",
      subtext: "Units across all variants",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A2F1F]">Analytics</h1>
        <p className="text-foreground mt-1 font-medium">Monitor your business performance and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const isPositive = stat.change.startsWith("+")
          return (
            <div
              key={i}
              className="bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-shadow"
              style={{ borderColor: "#D9CFC7" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded ${
                    isPositive ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-[#4A2F1F] mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
              {stat.subtext && <div className="text-xs text-foreground font-medium mt-1">{stat.subtext}</div>}
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg border-2 p-6" style={{ borderColor: "#D9CFC7" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#4A2F1F]">User Growth</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod("jan-jun")}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  period === "jan-jun" ? "bg-[#8B5A3C] text-white" : "bg-gray-100 text-foreground hover:bg-gray-200"
                }`}
              >
                Jan-Jun
              </button>
              <button
                onClick={() => setPeriod("jul-dec")}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  period === "jul-dec" ? "bg-[#8B5A3C] text-white" : "bg-gray-100 text-foreground hover:bg-gray-200"
                }`}
              >
                Jul-Dec
              </button>
            </div>
          </div>
          <ChartContainer
            config={{
              users: {
                label: "New Users",
                color: "hsl(280, 60%, 60%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9CFC7" />
                <XAxis dataKey="month" stroke="#4A2F1F" fontSize={12} fontWeight={600} />
                <YAxis stroke="#4A2F1F" fontSize={12} fontWeight={600} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(280, 60%, 60%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(280, 60%, 60%)", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Products by Category Chart */}
        <div className="bg-white rounded-lg border-2 p-6" style={{ borderColor: "#D9CFC7" }}>
          <h3 className="text-lg font-bold text-[#4A2F1F] mb-4">Products by Category</h3>
          <ChartContainer
            config={{
              count: {
                label: "Products",
                color: "hsl(30, 60%, 50%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.charts.productsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9CFC7" />
                <XAxis dataKey="category" stroke="#4A2F1F" fontSize={12} fontWeight={600} />
                <YAxis stroke="#4A2F1F" fontSize={12} fontWeight={600} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(30, 60%, 50%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
