"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { Search, RefreshCw, Users, Mail, Phone, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

interface Agent {
  id: string
  fullname: string
  email: string
  phone: string
  address: string
  createdAt: string
}

function AgentManagementContent() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const agentsPerPage = 10

  const fetchAgents = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/agents?${params.toString()}`, {
        credentials: "include",
      })
      const data = await response.json()

      if (data.success) {
        setAgents(data.agents)
        setCurrentPage(1)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch agents",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[FETCH_AGENTS_ERROR]", error)
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const totalPages = Math.ceil(agents.length / agentsPerPage)
  const startIndex = (currentPage - 1) * agentsPerPage
  const endIndex = startIndex + agentsPerPage
  const currentAgents = agents.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Agent Management</h1>
          <p className="text-foreground/70 mt-1">View and manage all registered agents</p>
        </div>
        <Button onClick={fetchAgents} disabled={isLoading} className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl border border-[#E5D5C5] shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-medium">Total Agents</h3>
            <p className="text-3xl font-bold text-foreground">{agents.length}</p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-lg border p-4 space-y-4" style={{ borderColor: "#D9CFC7" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
          <Input
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchAgents()
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchAgents} className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white w-full sm:w-auto">
          Search
        </Button>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg border border-[#E5D5C5] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#8B5A3C]/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Users className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-foreground/70">Loading agents...</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/70">No agents found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5D5C5] bg-[#F5F1ED]">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Agent Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Address</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D5C5]">
                  {currentAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-[#F5F1ED]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5A3C] to-[#6D4530] flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {agent.fullname.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground truncate">{agent.fullname}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-foreground">
                          <Mail className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                          <span className="truncate">{agent.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-foreground">
                          <Phone className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                          <span>{agent.phone || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-foreground">
                          <MapPin className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                          <span className="truncate">{agent.address || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                          <span>{formatDate(agent.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && agents.length > 0 && (
        <div className="px-6 py-4 border-t flex items-center justify-between bg-white rounded-lg" style={{ borderColor: "#D9CFC7" }}>
          <div className="text-sm text-foreground/70">
            Showing {startIndex + 1}-{Math.min(endIndex, agents.length)} of {agents.length}{" "}
            {agents.length === 1 ? "agent" : "agents"}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-[#8B5A3C] text-foreground hover:bg-[#8B5A3C] hover:text-white disabled:opacity-50 bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#8B5A3C] text-foreground hover:bg-[#8B5A3C] hover:text-white disabled:opacity-50 bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AgentManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AgentManagementContent />
    </Suspense>
  )
}
