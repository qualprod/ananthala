"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Image compression utility
const compressImage = async (file: File, maxWidth = 1200, maxHeight = 800, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new (window as any).Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, { type: "image/jpeg" })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function CreatePress() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    subheading: "",
    content: "",
    externalLink: "",
    status: "draft",
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError("")

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB")
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please upload a valid image file")
      toast({
        title: "Error",
        description: "Please upload a valid image file",
        variant: "destructive",
      })
      return
    }

    try {
      // Compress image
      const compressedFile = await compressImage(file)
      setImageFile(compressedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)

      toast({
        title: "Success",
        description: "Image uploaded and compressed successfully",
      })
    } catch (error) {
      setImageError("Failed to process image")
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as "draft" | "published",
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a title",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!formData.content.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter content",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!imageFile && !imagePreview) {
        toast({
          title: "Validation Error",
          description: "Please upload an image",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      let imageUrl = imagePreview

      // If imageFile exists, upload it (in production, use proper file upload service)
      if (imageFile && imageFile.size > 0) {
        const formDataForUpload = new FormData()
        formDataForUpload.append("file", imageFile)

        try {
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formDataForUpload,
          })

          if (!uploadResponse.ok) {
            // If upload fails, use compressed base64
            console.log("[v0] Using compressed base64 image data")
            imageUrl = imagePreview
          } else {
            const uploadData = await uploadResponse.json()
            imageUrl = uploadData.url
          }
        } catch (uploadError) {
          console.log("[v0] Upload service error, using base64:", uploadError)
          imageUrl = imagePreview
        }
      }

      const response = await fetch("/api/admin/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Press release created successfully!",
        })
        setTimeout(() => {
          router.push("/admin/press")
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create press release",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error creating press release:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create press release",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/press">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-stone-100">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-2xl font-semibold text-[#1a1a1a]">Create Press Release</h1>
            <p className="text-gray-600 mt-1">Add a new press release to share with your audience</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Featured Image <span className="text-red-500">*</span>
            </label>
            {imageError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{imageError}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className={`flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${imageError ? "border-red-300 bg-red-50 hover:border-red-400" : "border-gray-300 hover:border-[#8B5A3C] hover:bg-stone-50"}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-8 h-8 mb-2 ${imageError ? "text-red-400" : "text-gray-400"}`} />
                    <p className={`text-sm ${imageError ? "text-red-600" : "text-gray-600"}`}>Click to upload image</p>
                    <p className={`text-xs ${imageError ? "text-red-500" : "text-gray-500"}`}>PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!imagePreview}
                  />
                </label>
              </div>
              {imagePreview && (
                <div className="flex-1">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter press release title"
              className="border-gray-200 focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
              required
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
          </div>

          {/* Subheading */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Subheading</label>
            <Input
              type="text"
              name="subheading"
              value={formData.subheading}
              onChange={handleInputChange}
              placeholder="Enter subheading (optional)"
              className="border-gray-200 focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
              maxLength={300}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.subheading.length}/300 characters</p>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter detailed content for the press release"
              className="border-gray-200 focus:border-[#8B5A3C] focus:ring-[#8B5A3C] min-h-48"
              required
            />
          </div>

          {/* External Link */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">External Link (Optional)</label>
            <Input
              type="url"
              name="externalLink"
              value={formData.externalLink}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="border-gray-200 focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
            />
          </div>

          {/* Status */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="border-gray-200 focus:border-[#8B5A3C] focus:ring-[#8B5A3C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#8B5A3C] hover:bg-[#6B563F] text-white flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Press Release"
              )}
            </Button>
            <Link href="/admin/press">
              <Button type="button" variant="outline" className="border-gray-200">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
