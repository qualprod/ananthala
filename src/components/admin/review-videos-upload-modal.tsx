"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ReviewVideoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ReviewVideoUploadModal({ isOpen, onClose, onSuccess }: ReviewVideoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        setFile(selectedFile)
        setError("")
      } else {
        setError("Please select a valid video file")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !title) {
      setError("Please provide a video file and title")
      return
    }

    try {
      setLoading(true)
      setError("")

      // Validate file before upload (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setError("File size exceeds 20MB limit. Please upload a smaller video.")
        setLoading(false)
        return
      }

      // Upload video to Blob
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/admin/review-videos/upload", {
        method: "POST",
        body: formData,
      })

      // Check if response is ok
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({
          message: `Server error: ${uploadResponse.status}`,
        }))
        setError(errorData.message || "Failed to upload video")
        return
      }

      const uploadData = await uploadResponse.json()

      if (!uploadData.success) {
        setError(uploadData.message || "Failed to upload video")
        return
      }

      // Save video metadata
      const videoResponse = await fetch("/api/admin/review-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          customerName,
          blobUrl: uploadData.url,
        }),
      })

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json().catch(() => ({
          message: `Server error: ${videoResponse.status}`,
        }))
        setError(errorData.message || "Failed to save video")
        return
      }

      const videoData = await videoResponse.json()

      if (videoData.success) {
        setTitle("")
        setDescription("")
        setCustomerName("")
        setFile(null)
        onSuccess()
      } else {
        setError(videoData.message || "Failed to save video")
      }
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      setError(err.message || "An error occurred during upload")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#D9CFC7]">
          <h2 className="text-xl font-semibold text-[#6D4530]">Upload Review Video</h2>
          <button onClick={onClose} className="text-[#8B5A3C]/60 hover:text-[#8B5A3C] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Video File Upload */}
          <div>
            <label className="block text-sm font-medium text-[#6D4530] mb-2">Video File *</label>
            <div className="border-2 border-dashed border-[#D9CFC7] rounded-lg p-4 text-center cursor-pointer hover:border-[#8B5A3C] transition-colors">
              <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" id="video-input" />
              <label htmlFor="video-input" className="cursor-pointer">
                <Upload className="h-8 w-8 text-[#8B5A3C]/40 mx-auto mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-[#6D4530]">{file.name}</p>
                ) : (
                  <p className="text-sm text-[#8B5A3C]/60">Click to select or drag and drop</p>
                )}
                <p className="text-xs text-[#B8A396] mt-1">MP4, WebM, MOV (Max 100MB)</p>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#6D4530] mb-1">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Happy Customer Testimonial"
              className="border-[#D9CFC7] text-[#6D4530]"
            />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-[#6D4530] mb-1">Customer Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g., John Doe"
              className="border-[#D9CFC7] text-[#6D4530]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#6D4530] mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the testimonial"
              rows={3}
              className="border-[#D9CFC7] text-[#6D4530]"
            />
          </div>

          {/* Error Message */}
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="outline"
              className="flex-1 border-[#D9CFC7] text-[#6D4530] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file || !title}
              className="flex-1 bg-[#8B5A3C] hover:bg-[#6D4530] text-white flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
