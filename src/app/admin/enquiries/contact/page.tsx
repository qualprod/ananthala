"use client"

import { useState, useEffect } from "react"
import { Suspense } from "react"
import { Search, Eye, Mail, Phone, MessageSquare, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ContactUs {
  _id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  createdAt: string
}

function ContactUsContent() {
  const [contacts, setContacts] = useState<ContactUs[]>([])
  const [filteredContacts, setFilteredContacts] = useState<ContactUs[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<ContactUs | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (contact.phone && contact.phone.includes(searchQuery)),
      )
      setFilteredContacts(filtered)
    } else {
      setFilteredContacts(contacts)
    }
  }, [searchQuery, contacts])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/enquiries/contact", {
        credentials: "include",
      })
      const data = await response.json()
      if (data.success) {
        setContacts(data.contacts || [])
        setFilteredContacts(data.contacts || [])
      }
    } catch (error) {
      console.error("Failed to fetch contact messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const truncateMessage = (message: string, maxLength = 60) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + "..."
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Contact Us Messages</h1>
          <p className="text-foreground/70 mt-1">Review and manage customer inquiries</p>
        </div>
        <div className="bg-[#8B5A3C] text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-medium">Total Messages</p>
          <p className="text-2xl font-bold">{contacts.length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#D9CFC7" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
          <Input
            placeholder="Search by name, email, phone, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#D9CFC7" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F1ED]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Message Preview</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#D9CFC7" }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground/70">
                    Loading messages...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground/70">
                    {searchQuery ? "No messages found matching your search" : "No messages received yet"}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-[#F5F1ED]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{contact.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.phone ? (
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      ) : (
                        <span className="text-foreground/50 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground max-w-xs truncate">{contact.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground/70 max-w-sm">{truncateMessage(contact.message)}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {new Date(contact.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContact(contact)
                          setIsDetailModalOpen(true)
                        }}
                        className="text-foreground hover:text-foreground hover:bg-[#8B5A3C]/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full
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
            <DialogTitle className="text-foreground">Contact Message Details</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-[#F5F1ED] p-4 rounded-lg">
                <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70 font-medium">Name:</span>
                    <span className="text-foreground font-semibold">{selectedContact.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/70 font-medium">Email:</span>
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="text-foreground hover:underline font-semibold flex items-center gap-2"
                    >
                      <Mail className="w-3 h-3" />
                      {selectedContact.email}
                    </a>
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-medium">Phone:</span>
                      <a
                        href={`tel:${selectedContact.phone}`}
                        className="text-foreground hover:underline font-semibold flex items-center gap-2"
                      >
                        <Phone className="w-3 h-3" />
                        {selectedContact.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/70 font-medium">Date Received:</span>
                    <span className="text-foreground font-semibold flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedContact.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Subject
                </h3>
                <div className="bg-[#F5F1ED] p-4 rounded-lg text-foreground font-medium">{selectedContact.subject}</div>
              </div>

              {/* Message */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Message
                </h3>
                <div className="bg-[#F5F1ED] p-4 rounded-lg text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: "#D9CFC7" }}>
                <Button
                  className="flex-1 bg-[#8B5A3C] hover:bg-[#6D4530] text-white"
                  onClick={() => (window.location.href = `mailto:${selectedContact.email}`)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reply via Email
                </Button>
                {selectedContact.phone && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => (window.location.href = `tel:${selectedContact.phone}`)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ContactUsPage() {
  return (
    <Suspense fallback={null}>
      <ContactUsContent />
    </Suspense>
  )
}
