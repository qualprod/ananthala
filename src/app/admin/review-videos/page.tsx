"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ReviewVideoUploadModal from "@/components/admin/review-videos-upload-modal"

interface ReviewVideo {
  _id: string
  title: string
  description: string
  blobUrl: string
  customerName: string
  thumbnail?: string
  isActive: boolean
  displayOrder: number
  createdAt: string
}

export default function ReviewVideosPage() {
  const [videos, setVideos] = useState<ReviewVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<ReviewVideo>>({})
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/review-videos")
      const data = await response.json()

      if (data.success) {
        setVideos(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      setDeleting(id)
      setError(null)
      const response = await fetch(`/api/admin/review-videos/${id}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setVideos(videos.filter((v) => v._id !== id))
        setSuccess("Video deleted successfully")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || "Failed to delete video")
      }
    } catch (error) {
      console.error("[v0] Error deleting video:", error)
      setError("Failed to delete video. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/review-videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      const data = await response.json()

      if (data.success) {
        setVideos(videos.map((v) => (v._id === id ? data.data : v)))
        setEditingId(null)
        setEditData({})
        setSuccess("Video updated successfully")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || "Failed to update video")
      }
    } catch (error) {
      console.error("[v0] Error updating video:", error)
      setError("Failed to update video. Please try again.")
    }
  }

  const moveVideo = async (index: number, direction: "up" | "down") => {
    const newVideos = [...videos]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newVideos.length) return
    ;[newVideos[index].displayOrder, newVideos[targetIndex].displayOrder] = [
      newVideos[targetIndex].displayOrder,
      newVideos[index].displayOrder,
    ]

    const temp = newVideos[index]
    newVideos[index] = newVideos[targetIndex]
    newVideos[targetIndex] = temp

    setVideos(newVideos)

    try {
      await Promise.all([
        fetch(`/api/admin/review-videos/${newVideos[index]._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: newVideos[index].displayOrder }),
        }),
        fetch(`/api/admin/review-videos/${newVideos[targetIndex]._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: newVideos[targetIndex].displayOrder }),
        }),
      ])
    } catch (error) {
      console.error("[v0] Error updating order:", error)
      fetchVideos()
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/review-videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      const data = await response.json()

      if (data.success) {
        setVideos(videos.map((v) => (v._id === id ? data.data : v)))
        setSuccess(`Video ${!currentStatus ? "activated" : "deactivated"} successfully`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || "Failed to update video status")
      }
    } catch (error) {
      console.error("[v0] Error toggling active status:", error)
      setError("Failed to update video status. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#8B5A3C]/10 animate-pulse mx-auto mb-4" />
          <p className="text-foreground">Loading review videos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Review Videos</h1>
          <p className="text-foreground/60 mt-1">Manage customer testimonial videos displayed on homepage</p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      {/* Upload Modal */}
      <ReviewVideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false)
          fetchVideos()
        }}
      />

      {/* Video List */}
      <div className="space-y-3">
        {videos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-[#D9CFC7]">
            <p className="text-foreground/60">No review videos yet. Add one to get started!</p>
          </div>
        ) : (
          videos.map((video, index) => (
            <div
              key={video._id}
              className="bg-white rounded-lg border border-[#D9CFC7] p-4 transition-all hover:shadow-md"
            >
              {editingId === video._id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                    <Input
                      value={editData.title || ""}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      placeholder="Video title"
                      className="border-[#D9CFC7] text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <Textarea
                      value={editData.description || ""}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      placeholder="Brief description"
                      className="border-[#D9CFC7] text-foreground"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Customer Name</label>
                    <Input
                      value={editData.customerName || ""}
                      onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                      placeholder="Customer name"
                      className="border-[#D9CFC7] text-foreground"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(video._id)}
                      className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null)
                        setEditData({})
                      }}
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{video.title}</h3>
                        {video.customerName && <p className="text-sm text-foreground/70">by {video.customerName}</p>}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          video.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {video.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {video.description && <p className="text-sm text-foreground/60 mb-2">{video.description}</p>}
                    <p className="text-xs text-foreground/70">{new Date(video.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4 flex-wrap justify-end">
                    <Button
                      onClick={() => moveVideo(index, "up")}
                      disabled={index === 0}
                      size="sm"
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground disabled:opacity-50"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => moveVideo(index, "down")}
                      disabled={index === videos.length - 1}
                      size="sm"
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground disabled:opacity-50"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => toggleActive(video._id, video.isActive)}
                      size="sm"
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground"
                    >
                      {video.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(video._id)
                        setEditData(video)
                      }}
                      size="sm"
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(video._id)}
                      disabled={deleting === video._id}
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
