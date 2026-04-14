"use client"

import { useState, useEffect } from "react"
import { Search, RefreshCw, UserIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  fullname: string
  email: string
  role: "customer" | "admin" | "agent"
  phone?: string
  address?: string
  createdAt: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (filterRole !== "all") params.append("role", filterRole)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setCurrentPage(1)
        console.log("[v0] Loaded users:", data.users.length)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[FETCH_USERS_ERROR]", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: "customer" | "admin" | "agent", checked: boolean) => {
    if (!checked) return // Only handle when checkbox is checked

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        })
        // Update local state
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[UPDATE_ROLE_ERROR]", error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Get gradient color based on name
  const getGradientColor = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase()
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-green-500",
    ]
    const index = firstLetter.charCodeAt(0) % colors.length
    return colors[index]
  }

  const totalPages = Math.ceil(users.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">User Management</h1>
          <p className="text-foreground/70 mt-1">
            Manage user roles and permissions ({users.length} {users.length === 1 ? "user" : "users"})
          </p>
        </div>
        <Button onClick={fetchUsers} className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4" style={{ borderColor: "#D9CFC7" }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchUsers()
              }}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchUsers} className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
            Apply
          </Button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#D9CFC7" }}>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#8B5A3C]/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <UserIcon className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-foreground/70">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <UserIcon className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/70">No users found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F1ED]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">User Details</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Customer</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Admin</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Agent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#D9CFC7" }}>
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F5F1ED]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradientColor(user.fullname)} flex items-center justify-center text-white font-semibold`}
                        >
                          {user.fullname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.fullname}</div>
                          <div className="text-sm text-foreground/80 font-medium">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={user.role === "customer"}
                          onCheckedChange={(checked) => handleRoleChange(user.id, "customer", checked as boolean)}
                          className="border-2 border-[#8B5A3C] data-[state=checked]:bg-[#8B5A3C] data-[state=checked]:border-[#8B5A3C] w-5 h-5"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={user.role === "admin"}
                          onCheckedChange={(checked) => handleRoleChange(user.id, "admin", checked as boolean)}
                          className="border-2 border-[#8B5A3C] data-[state=checked]:bg-[#8B5A3C] data-[state=checked]:border-[#8B5A3C] w-5 h-5"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={user.role === "agent"}
                          onCheckedChange={(checked) => handleRoleChange(user.id, "agent", checked as boolean)}
                          className="border-2 border-[#8B5A3C] data-[state=checked]:bg-[#8B5A3C] data-[state=checked]:border-[#8B5A3C] w-5 h-5"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#D9CFC7" }}>
            <div className="text-sm text-foreground/70">
              Showing {startIndex + 1}-{Math.min(endIndex, users.length)} of {users.length}{" "}
              {users.length === 1 ? "user" : "users"}
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
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="border-[#8B5A3C] text-foreground hover:bg-[#8B5A3C] hover:text-white disabled:opacity-50 bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
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
    </div>
  )
}
