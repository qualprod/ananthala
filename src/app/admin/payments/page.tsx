"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  MoreVertical,
  IndianRupee,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Payment {
  _id: string
  orderId: string
  customerId: string
  customerName: string
  customerEmail: string
  paymentStatus: string
  razorpayPaymentId: string
  totalAmount: number
  createdAt: string
}

interface PaymentStats {
  totalPayments: number
  completedPayments: number
  failedPayments: number
  pendingPayments: number
  totalPaymentAmount: number
  averagePaymentAmount: number
}

interface PaginationData {
  page: number
  limit: number
  totalPayments: number
  totalPages: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchPayments()
  }, [filterStatus, page])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (searchQuery) params.append("search", searchQuery)
      params.append("page", page.toString())

      const response = await fetch(`/api/admin/payments?${params}`, {
        credentials: "include",
      })
      const data = await response.json()
      setPayments(data.payments || [])
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPayments()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "failed":
        return "bg-red-100 text-red-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const dateOnly = date.toLocaleDateString("en-IN")
    const timeOnly = date.toLocaleTimeString("en-IN")
    return `${dateOnly} ${timeOnly}`
  }

  const statCards = [
    {
      label: "Total Payments",
      value: stats?.totalPayments || 0,
      color: "bg-blue-50 border-blue-200",
      icon: CreditCard,
      textColor: "text-blue-700",
    },
    {
      label: "Completed",
      value: stats?.completedPayments || 0,
      color: "bg-green-50 border-green-200",
      icon: CheckCircle,
      textColor: "text-green-700",
    },
    {
      label: "Pending",
      value: stats?.pendingPayments || 0,
      color: "bg-yellow-50 border-yellow-200",
      icon: Clock,
      textColor: "text-yellow-700",
    },
    {
      label: "Failed",
      value: stats?.failedPayments || 0,
      color: "bg-red-50 border-red-200",
      icon: AlertCircle,
      textColor: "text-red-700",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-2xl font-semibold text-foreground">Payments Management</h1>
          <p className="text-foreground/70 mt-1">Track and manage all customer payments</p>
        </div>
        <Button className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Payments
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`${stat.color} border rounded-lg p-6 transition-all hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground/70 text-sm font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.textColor}/30`} />
              </div>
            </div>
          )
        })}

        {stats && (
          <div className="bg-gradient-to-r from-[#8B5A3C] to-[#6D4530] rounded-lg p-6 text-white border border-[#8B5A3C] col-span-1 sm:col-span-2 lg:col-span-2">
            <p className="text-white/70 text-sm font-medium">Total Payment Amount</p>
            <div className="flex items-center gap-2 mt-2">
              <IndianRupee className="w-6 h-6" />
              <p className="text-2xl font-bold">
                {stats.totalPaymentAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        )}

        
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4" style={{ borderColor: "#D9CFC7" }}>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search by Order ID, Payment ID, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white w-full sm:w-auto">
            Search
          </Button>
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#D9CFC7" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F1ED]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Razorpay Payment ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date & Time</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#D9CFC7" }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground/70">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground/70">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-[#F5F1ED]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-foreground">{payment.orderId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{payment.customerName}</div>
                        <div className="text-xs text-foreground/70">{payment.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-foreground">{payment.razorpayPaymentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {payment.totalAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(
                          payment.paymentStatus
                        )}`}
                      >
                        {getStatusIcon(payment.paymentStatus)}
                        {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground text-sm">{formatDate(payment.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment)
                              setIsDetailModalOpen(true)
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(payment.razorpayPaymentId)
                            }}
                          >
                            Copy Payment ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#D9CFC7" }}>
          <div className="text-sm text-foreground/70">
            Showing {payments.length > 0 ? (page - 1) * 10 + 1 : 0} -{" "}
            {Math.min(page * 10, pagination?.totalPayments || 0)} of {pagination?.totalPayments || 0} payments
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Page {page}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!pagination || page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F5F1ED] rounded-lg">
                <div>
                  <p className="text-xs text-foreground/70 font-medium">Order ID</p>
                  <p className="text-lg font-semibold text-foreground">{selectedPayment.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/70 font-medium">Payment Status</p>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit mt-1 ${getStatusColor(
                      selectedPayment.paymentStatus
                    )}`}
                  >
                    {getStatusIcon(selectedPayment.paymentStatus)}
                    {selectedPayment.paymentStatus.charAt(0).toUpperCase() + selectedPayment.paymentStatus.slice(1)}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Payment Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Razorpay Payment ID:</span>
                    <span className="font-mono text-foreground">{selectedPayment.razorpayPaymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Customer ID:</span>
                    <span className="font-mono text-foreground">{selectedPayment.customerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Payment Amount:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {selectedPayment.totalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Name:</span> {selectedPayment.customerName}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium">Email:</span> {selectedPayment.customerEmail}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Transaction Date & Time</h3>
                <p className="text-sm text-foreground">{formatDate(selectedPayment.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
