"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Package, Users, ShoppingCart, BarChart3, TrendingUp, Clock, AlertCircle, Calendar, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalInventory: number
  totalRevenue: number
  adminCount: number
  agentCount: number
}

interface RecentUser {
  _id: string
  fullname: string
  email: string
  createdAt: string
  phone?: string
}

interface RecentProduct {
  id: string
  name: string
  seller: string
  category: string
  price: number
  stock: number
  dateAdded: string
}

interface CategoryData {
  _id: string
  count: number
}

interface InventoryData {
  _id: string
  totalStock: number
  avgPrice: number
  productCount: number
}

interface RecentOrder {
  id: string
  orderId: string
  customerName: string
  customerEmail: string
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  itemCount: number
  dateOrdered: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-700"
    case "completed":
      return "bg-green-100 text-green-700"
    case "cancelled":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
const [inventoryData, setInventoryData] = useState<InventoryData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [orderTimeframe, setOrderTimeframe] = useState("30days")
  
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/auth/admin/admin-verify", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Authentication failed")
        }

        const data = await response.json()

        if (!data.authenticated || data.user?.role !== "admin") {
          sessionStorage.removeItem("admin_session")
          router.replace("/admin")
          return
        }

        sessionStorage.setItem("admin_session", "active")

        await fetchDashboardData()
      } catch (error) {
        sessionStorage.removeItem("admin_session")
        router.replace("/admin")
      }
    }

    verifyAuth()
  }, [router])

const fetchDashboardData = async (timeframe: string = orderTimeframe) => {
    try {
      setIsLoading(true)
      const [statsRes, productsRes] = await Promise.all([
        fetch("/api/admin/dashboard/stats", { credentials: "include" }),
        fetch(`/api/admin/dashboard/recent-orders?timeframe=${timeframe}`, { credentials: "include" }),
      ])

      if (!statsRes.ok || !productsRes.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const statsData = await statsRes.json()
      const productsData = await productsRes.json()

      setStats(statsData.stats)
      setRecentUsers(statsData.recentUsers)
      setCategoryData(statsData.categoryData)
      setInventoryData(statsData.inventoryByCategory)
      setRecentProducts(productsData.recentProducts)
      setRecentOrders(productsData.recentOrders || [])
      setOrderStats(productsData.orderStats || null)
      setIsLoading(false)
    } catch (err) {
      setError("Failed to load dashboard data")
      setIsLoading(false)
    }
  }

  const handleTimeframeChange = (newTimeframe: string) => {
    setOrderTimeframe(newTimeframe)
    fetchDashboardData(newTimeframe)
  }

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case "7days": return "Last 7 Days"
      case "30days": return "Last 30 Days"
      case "90days": return "Last 90 Days"
      case "1year": return "Last 1 Year"
      case "all": return "All Time"
      default: return "Last 30 Days"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "mattress":
        return "bg-amber-100 text-amber-700"
      case "pillow":
        return "bg-blue-100 text-blue-700"
      case "bedding":
        return "bg-purple-100 text-purple-700"
      case "bedsheet":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-[#EED9C4] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-[#EED9C4]" />
          </div>
          <p className="text-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground font-medium">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4 bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
        <p className="text-foreground">Real-time insights and analytics for your Ananthala store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-foreground text-base font-medium mb-1">Total Users</h3>
          <p className="text-[2rem] font-bold text-foreground">{stats?.totalUsers || 0}</p>
          <div className="mt-3 flex gap-2 text-sm text-foreground">
            <span>Admins: {stats?.adminCount}</span>
            <span>|</span>
            <span>Agents: {stats?.agentCount}</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-foreground text-base font-medium mb-1">Total Products</h3>
          <p className="text-[2rem] font-bold text-foreground">{stats?.totalProducts || 0}</p>
          <p className="mt-3 text-sm text-foreground">Active listings in catalog</p>
        </div>

        {/* Total Inventory */}
        <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-foreground text-base font-medium mb-1">Total Inventory</h3>
          <p className="text-[2rem] font-bold text-foreground">{stats?.totalInventory || 0}</p>
          <p className="mt-3 text-sm text-foreground">Units in stock</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-foreground text-base font-medium mb-1">Inventory Value</h3>
          <p className="text-[2rem] font-bold text-foreground">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
          <p className="mt-3 text-sm text-foreground">Total stock value</p>
        </div>
      </div>

      

{/* Recent Orders Section */}
      <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-[#6D4530] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            Recent Orders
          </h3>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#8B5A3C]" />
            <Select value={orderTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[160px] border-[#E5D5C5]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Order Stats Summary */}
        {orderStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#F5F1ED] rounded-lg p-3 text-center">
              <p className="text-xs text-[#8B5A3C] mb-1">Total Orders</p>
              <p className="text-xl font-bold text-[#6D4530]">{orderStats.totalOrders}</p>
            </div>
            <div className="bg-[#F5F1ED] rounded-lg p-3 text-center">
              <p className="text-xs text-[#8B5A3C] mb-1">Revenue</p>
              <p className="text-xl font-bold text-[#6D4530] flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
                {orderStats.totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-xs text-yellow-700 mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-700">{orderStats.pendingOrders}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-700 mb-1">Delivered</p>
              <p className="text-xl font-bold text-green-700">{orderStats.completedOrders}</p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#E5D5C5] bg-[#F5F1ED]">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#6D4530]">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#6D4530]">Customer</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[#6D4530]">Items</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[#6D4530]">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[#6D4530]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#6D4530]">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#E5D5C5] hover:bg-[#FAF8F6] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#6D4530] text-sm">{order.orderId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#6D4530] text-sm">{order.customerName}</p>
                      <p className="text-xs text-[#8B5A3C]">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-[#6D4530]">{order.itemCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-[#6D4530] flex items-center justify-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {order.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#8B5A3C] flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {order.dateOrdered}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-[#D9CFC7] mx-auto mb-3" />
            <p className="text-[#8B5A3C] font-medium">No orders in {getTimeframeLabel(orderTimeframe).toLowerCase()}</p>
          </div>
        )}

        <p className="text-xs text-[#B8A396] mt-4 text-center">
          Showing orders from {getTimeframeLabel(orderTimeframe).toLowerCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Joined Users */}
        <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Recently Joined Users
          </h3>
          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user._id} className="border-b border-[#E5D5C5] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground">{user.fullname}</p>
                    <span className="text-sm bg-[#F5F1ED] text-foreground px-2 py-1 rounded-full">{user.createdAt}</span>
                  </div>
                  <p className="text-sm text-foreground">{user.email}</p>
                  {user.phone && <p className="text-sm text-foreground/70 mt-1">{user.phone}</p>}
                </div>
              ))
            ) : (
              <p className="text-center text-foreground py-4">No users yet</p>
            )}
          </div>
        </div>

        {/* Recently Added Products Table */}
        <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Recently Added Products
          </h3>
          {recentProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E5D5C5] bg-[#F5F1ED]">
                    <th className="px-4 py-3 text-left text-base font-semibold text-foreground">Product Name</th>
                    <th className="px-4 py-3 text-left text-base font-semibold text-foreground">Category</th>
                    <th className="px-4 py-3 text-left text-base font-semibold text-foreground">Seller</th>
                    <th className="px-4 py-3 text-center text-base font-semibold text-foreground">Price</th>
                    <th className="px-4 py-3 text-center text-base font-semibold text-foreground">Stock</th>
                    <th className="px-4 py-3 text-left text-base font-semibold text-foreground">Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((product) => (
                    <tr key={product.id} className="border-b border-[#E5D5C5] hover:bg-[#FAF8F6] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate">{product.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getCategoryColor(product.category)}`}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{product.seller}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-semibold text-foreground">₹{product.price.toFixed(0)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${product.stock > 10 ? "bg-green-100 text-green-700" : product.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {product.dateAdded}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-[#D9CFC7] mx-auto mb-3" />
              <p className="text-foreground font-medium">No products added yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <button
          onClick={() => router.push("/admin/users")}
          className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300 group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">Manage Users</h4>
          <p className="text-sm text-foreground">View & manage user accounts</p>
        </button>

        <button
          onClick={() => router.push("/admin/products")}
          className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300 group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">Manage Products</h4>
          <p className="text-sm text-foreground">Add, edit & remove products</p>
        </button>

        <button
          onClick={() => router.push("/admin/orders")}
          className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300 group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">View Orders</h4>
          <p className="text-sm text-foreground">Track & manage orders</p>
        </button>

        <button
          onClick={() => router.push("/admin/analytics")}
          className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6 hover:shadow-lg transition-all duration-300 group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">Analytics</h4>
          <p className="text-sm text-foreground">View detailed reports</p>
        </button>
      </div>
    </div>
  )
}
