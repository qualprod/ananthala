"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Mail, Phone, Building2, MapPin, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"

interface DealerEnquiry {
  _id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  city: string
  state: string
  businessType: string
  retailSpace: string
  inventory: string
  message?: string
  createdAt: string
}

function DealerEnquiriesContent() {
  const [enquiries, setEnquiries] = useState<DealerEnquiry[]>([])
  const [filteredEnquiries, setFilteredEnquiries] = useState<DealerEnquiry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEnquiry, setSelectedEnquiry] = useState<DealerEnquiry | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = enquiries.filter(
        (enquiry) =>
          enquiry.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          enquiry.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          enquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          enquiry.phone.includes(searchQuery) ||
          enquiry.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredEnquiries(filtered)
    } else {
      setFilteredEnquiries(enquiries)
    }
  }, [searchQuery, enquiries])

  const fetchEnquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/enquiries/dealer", {
        credentials: "include",
      })
      const data = await response.json()
      if (data.success) {
        setEnquiries(data.enquiries || [])
        setFilteredEnquiries(data.enquiries || [])
      }
    } catch (error) {
      console.error("Failed to fetch dealer enquiries:", error)
    } finally {
      setLoading(false)
    }
  }

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      furniture: "Furniture Store",
      bedding: "Bedding Store",
      home: "Home Decor",
      online: "Online Retailer",
      other: "Other",
    }
    return types[type] || type
  }

  const getBusinessTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      furniture: "bg-blue-100 text-blue-700",
      bedding: "bg-purple-100 text-purple-700",
      home: "bg-green-100 text-green-700",
      online: "bg-orange-100 text-orange-700",
      other: "bg-gray-100 text-gray-700",
    }
    return colors[type] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Dealer Enquiries</h1>
          <p className="text-foreground/70 mt-1">Manage and review dealer partnership requests</p>
        </div>
        <div className="bg-[#8B5A3C] text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-medium">Total Enquiries</p>
          <p className="text-2xl font-bold">{enquiries.length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#D9CFC7" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
          <Input
            placeholder="Search by business name, owner, email, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#D9CFC7" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F1ED]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Business Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Owner</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Business Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#D9CFC7" }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground/70">
                    Loading enquiries...
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground/70">
                    {searchQuery ? "No enquiries found matching your search" : "No enquiries received yet"}
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-[#F5F1ED]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{enquiry.businessName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{enquiry.ownerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Mail className="w-3 h-3" />
                          {enquiry.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Phone className="w-3 h-3" />
                          {enquiry.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">
                        {enquiry.city}, {enquiry.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getBusinessTypeColor(enquiry.businessType)} border-0`}>
                        {getBusinessTypeLabel(enquiry.businessType)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {new Date(enquiry.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEnquiry(enquiry)
                          setIsDetailModalOpen(true)
                        }}
                        className="text-foreground hover:text-foreground hover:bg-[#8B5A3C]/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Dealer Enquiry Details</DialogTitle>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="space-y-6">
              {/* Business Information */}
              <div className="bg-[#F5F1ED] p-4 rounded-lg">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Business Name:</span>
                    <span className="text-foreground font-semibold">{selectedEnquiry.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Owner Name:</span>
                    <span className="text-foreground font-semibold">{selectedEnquiry.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Business Type:</span>
                    <Badge className={`${getBusinessTypeColor(selectedEnquiry.businessType)} border-0`}>
                      {getBusinessTypeLabel(selectedEnquiry.businessType)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="w-4 h-4 text-foreground" />
                    <a href={`mailto:${selectedEnquiry.email}`} className="hover:underline">
                      {selectedEnquiry.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="w-4 h-4 text-foreground" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </h3>
                <div className="text-sm text-foreground">
                  {selectedEnquiry.city}, {selectedEnquiry.state}
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Business Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Retail Space:</span>
                    <span className="text-foreground font-semibold">{selectedEnquiry.retailSpace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Inventory Interest:</span>
                    <span className="text-foreground font-semibold">{selectedEnquiry.inventory} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Enquiry Date:</span>
                    <span className="text-foreground font-semibold">
                      {new Date(selectedEnquiry.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedEnquiry.message && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Additional Message</h3>
                  <div className="bg-[#F5F1ED] p-4 rounded-lg text-sm text-foreground leading-relaxed">
                    {selectedEnquiry.message}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: "#D9CFC7" }}>
                <Button
                  className="flex-1 bg-[#8B5A3C] hover:bg-[#6D4530] text-white"
                  onClick={() => (window.location.href = `mailto:${selectedEnquiry.email}`)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => (window.location.href = `tel:${selectedEnquiry.phone}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DealerEnquiriesPage() {
  return (
    <Suspense fallback={null}>
      <DealerEnquiriesContent />
    </Suspense>
  )
}
