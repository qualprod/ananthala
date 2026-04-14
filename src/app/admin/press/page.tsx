"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PressRelease {
  _id: string
  title: string
  subheading?: string
  content: string
  image: string
  externalLink?: string
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
}

export default function PressManagement() {
  const router = useRouter()
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([])
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchPressReleases = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/admin/press")
      const data = await response.json()

      if (data.success) {
        setPressReleases(data.pressReleases)
      }
    } catch (error) {
      console.error("Error fetching press releases:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPressReleases()
  }, [])

  const handleRefresh = () => {
    fetchPressReleases()
  }

  const handleDelete = async (pressId: string) => {
    if (!confirm("Are you sure you want to delete this press release?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/press/${pressId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setPressReleases((prev) => prev.filter((p) => p._id !== pressId))
        alert("Press release deleted successfully!")
      } else {
        alert(data.message || "Failed to delete press release")
      }
    } catch (error) {
      console.error("Error deleting press release:", error)
      alert("Failed to delete press release")
    }
  }

  const filteredReleases = pressReleases.filter((release) => {
    if (selectedStatus === "all") return true
    return release.status === selectedStatus
  })

  const paginatedReleases = filteredReleases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredReleases.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a1a] mb-2">Press Release Management</h1>
            <p className="text-gray-600">Manage and publish press releases for your audience</p>
          </div>
          <Link href="/admin/press/create">
            <Button className="bg-[#8B5A3C] hover:bg-[#6B563F] text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Press Release
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48 border-gray-200 bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-200 text-foreground hover:bg-stone-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Press Releases Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
          ) : paginatedReleases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No press releases found</p>
              <Link href="/admin/press/create">
                <Button className="bg-[#8B5A3C] hover:bg-[#6B563F] text-white">Create First Press Release</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-stone-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReleases.map((release) => (
                    <tr key={release._id} className="border-b border-gray-100 hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        <div className="line-clamp-2">{release.title}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            release.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {release.status.charAt(0).toUpperCase() + release.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(release.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/press/edit/${release._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-foreground hover:bg-stone-100"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(release._id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • Total: {filteredReleases.length} releases
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="border-gray-200"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="border-gray-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
