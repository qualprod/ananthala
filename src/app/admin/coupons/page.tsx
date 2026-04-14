"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Copy, Check, X, Tag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Agent {
  id: string
  name: string
  email: string
}

interface Coupon {
  id: string
  code: string
  discount: number
  type: "percentage" | "fixed"
  minPurchase: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  expiryDate: string
  status: "active" | "expired" | "inactive"
  agents?: string[]
  agentNames?: string[]
}

export default function AdminCouponManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    type: "percentage",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    expiryDate: "",
    agents: [] as string[],
  })

  const [messages, setMessages] = useState({ success: "", error: "" })

  // Fetch coupons and agents on mount
  useEffect(() => {
    fetchCoupons()
    fetchAgents()
  }, [])

  const fetchCoupons = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/coupons", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch coupons")
      }

      const data = await response.json()
      if (data.success) {
        console.log("[v0] Received coupons:", data.coupons.length)
        const mappedCoupons = data.coupons.map((coupon: any) => {
          const mapped = {
            id: coupon._id,
            code: coupon.code,
            discount: coupon.discount,
            type: coupon.type,
            minPurchase: coupon.minPurchase,
            maxDiscount: coupon.maxDiscount,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            expiryDate: new Date(coupon.expiryDate).toISOString().split("T")[0],
            status: coupon.status,
            agents: coupon.agents || [],
            agentNames: coupon.agentNames || [],
          }
          console.log(`[v0] Coupon ${coupon.code} - agentNames:`, mapped.agentNames)
          return mapped
        })
        setCoupons(mappedCoupons)
      }
    } catch (error) {
      console.error("Error fetching coupons:", error)
      setMessages({ success: "", error: "Failed to fetch coupons" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      setIsLoadingAgents(true)
      const response = await fetch("/api/admin/agents", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch agents")
      }

      const data = await response.json()
      if (data.success) {
        setAgents(data.agents)
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
    } finally {
      setIsLoadingAgents(false)
    }
  }

  const toggleAgent = (agentId: string) => {
    setFormData((prev) => ({
      ...prev,
      agents: prev.agents.includes(agentId) ? prev.agents.filter((id) => id !== agentId) : [...prev.agents, agentId],
    }))
  }

  const handleAddCoupon = async () => {
    // Validation
    if (!formData.code || !formData.discount || !formData.minPurchase || !formData.usageLimit || !formData.expiryDate) {
      setMessages({ success: "", error: "Please fill all required fields" })
      return
    }

    if (formData.type === "percentage" && Number.parseInt(formData.discount) > 100) {
      setMessages({ success: "", error: "Percentage discount cannot exceed 100%" })
      return
    }

    setIsSubmitting(true)
    try {
      // Get selected agent names
      const selectedAgentNames = formData.agents.map(
        (id) => agents.find((a) => a.id === id)?.name || ""
      ).filter(Boolean)

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: formData.code,
          discount: Number.parseInt(formData.discount),
          type: formData.type,
          minPurchase: Number.parseInt(formData.minPurchase),
          maxDiscount: formData.maxDiscount ? Number.parseInt(formData.maxDiscount) : undefined,
          usageLimit: Number.parseInt(formData.usageLimit),
          expiryDate: formData.expiryDate,
          agents: formData.agents,
          agentNames: selectedAgentNames,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages({ success: "Coupon created successfully!", error: "" })
        setFormData({
          code: "",
          discount: "",
          type: "percentage",
          minPurchase: "",
          maxDiscount: "",
          usageLimit: "",
          expiryDate: "",
          agents: [],
        })
        setIsAddDialogOpen(false)
        fetchCoupons()
      } else {
        setMessages({ success: "", error: data.error || "Failed to create coupon" })
      }
    } catch (error) {
      setMessages({ success: "", error: "An error occurred while creating the coupon" })
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setMessages({ success: "Coupon deleted successfully!", error: "" })
        fetchCoupons()
      } else {
        setMessages({ success: "", error: "Failed to delete coupon" })
      }
    } catch (error) {
      setMessages({ success: "", error: "An error occurred while deleting the coupon" })
      console.error("Error:", error)
    }
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "expired":
        return "bg-red-100 text-red-700"
      case "inactive":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter((c) => c.status === "active").length
  const expiredCoupons = coupons.filter((c) => c.status === "expired").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Coupon Management</h1>
          <p className="text-foreground/70 mt-1">Generate and manage discount coupons</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Generate Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] font-roboto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Generate New Coupon</DialogTitle>
              <DialogDescription className="text-foreground/70">
                Create a new discount coupon for customers
              </DialogDescription>
            </DialogHeader>

            {/* Messages */}
            {messages.error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{messages.error}</p>
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code" className="text-foreground">
                  Coupon Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="discount" className="text-foreground">
                    Discount Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="10"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="border-[#D9CFC7] focus:border-[#8B5A3C]"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-foreground">
                    Discount Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger className="border-[#D9CFC7] focus:border-[#8B5A3C]" disabled={isSubmitting}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minPurchase" className="text-foreground">
                    Min. Purchase (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    placeholder="500"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="border-[#D9CFC7] focus:border-[#8B5A3C]"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxDiscount" className="text-foreground">
                    Max. Discount (₹)
                  </Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    placeholder="100"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="border-[#D9CFC7] focus:border-[#8B5A3C]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="usageLimit" className="text-foreground">
                    Usage Limit <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    placeholder="100"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="border-[#D9CFC7] focus:border-[#8B5A3C]"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryDate" className="text-foreground">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="border-[#D9CFC7] focus:border-[#8B5A3C]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Agent Selection */}
              <div className="grid gap-2 border-t border-[#D9CFC7] pt-4">
                <Label className="text-foreground">
                  Assign to Agents (Optional)
                </Label>
                <p className="text-sm text-foreground/70 mb-3">
                  {formData.agents.length > 0
                    ? `${formData.agents.length} agent(s) selected`
                    : "No agents selected - coupon available to all"}
                </p>
                {isLoadingAgents ? (
                  <p className="text-sm text-foreground">Loading agents...</p>
                ) : agents.length === 0 ? (
                  <p className="text-sm text-foreground/70">No agents available</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-[#D9CFC7] rounded-lg p-3 bg-stone-50">
                    {agents.map((agent) => (
                      <label key={agent.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.agents.includes(agent.id)}
                          onChange={() => toggleAgent(agent.id)}
                          disabled={isSubmitting}
                          className="w-4 h-4 border-[#D9CFC7] text-foreground focus:ring-[#8B5A3C] rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{agent.name}</p>
                          <p className="text-xs text-foreground/70">{agent.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setMessages({ success: "", error: "" })
                }}
                className="border-[#D9CFC7] text-foreground hover:bg-[#F5F1ED]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCoupon}
                className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Generate Coupon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      {messages.success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{messages.success}</p>
        </div>
      )}
      {messages.error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{messages.error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-[#D9CFC7] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <Input
              placeholder="Search by coupon code or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#D9CFC7] focus:border-[#8B5A3C]"
            />
          </div>
        </div>
      </div>

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#D9CFC7] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70 font-medium">Total Coupons</p>
              <p className="text-3xl font-bold text-foreground mt-2">{totalCoupons}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#8B5A3C]/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#D9CFC7] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70 font-medium">Active Coupons</p>
              <p className="text-3xl font-bold text-foreground mt-2">{activeCoupons}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#D9CFC7] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70 font-medium">Expired Coupons</p>
              <p className="text-3xl font-bold text-foreground mt-2">{expiredCoupons}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-[#D9CFC7] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-foreground/70">Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-foreground/70">No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F1ED] hover:bg-[#F5F1ED]">
                  <TableHead className="text-foreground font-semibold">Coupon Code</TableHead>
                  <TableHead className="text-foreground font-semibold">Discount</TableHead>
                  <TableHead className="text-foreground font-semibold">Min. Purchase</TableHead>
                  <TableHead className="text-foreground font-semibold">Usage</TableHead>
                  <TableHead className="text-foreground font-semibold">Agents</TableHead>
                  <TableHead className="text-foreground font-semibold">Expiry Date</TableHead>
                  <TableHead className="text-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-foreground font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id} className="hover:bg-[#F5F1ED]/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">{coupon.code}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-foreground hover:text-foreground"
                          onClick={() => handleCopyCode(coupon.code, coupon.id)}
                        >
                          {copiedId === coupon.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {coupon.type === "percentage" ? `${coupon.discount}%` : `₹${coupon.discount}`}
                      {coupon.maxDiscount && (
                        <span className="text-xs text-foreground/70 ml-1 block">(max ₹{coupon.maxDiscount})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">₹{coupon.minPurchase}</TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex items-center gap-2">
                        <span>
                          {coupon.usedCount}/{coupon.usageLimit}
                        </span>
                        <div className="w-12 h-1.5 bg-[#D9CFC7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8B5A3C]"
                            style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.agentNames && coupon.agentNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {coupon.agentNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-[#8B5A3C]/10 text-foreground rounded-full font-medium"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-foreground/70 text-sm">All agents</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">{coupon.expiryDate}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(coupon.status)}`}
                      >
                        {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
