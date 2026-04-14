"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function CreateBlogPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    image: "",
    author: "Ananthala Team",
    category: "Sleep Tips",
    tags: "",
    published: true,
    featured: false,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData({ ...formData, image: base64String })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const response = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          slug,
          tags: tagsArray,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Blog created successfully!")
        router.push("/admin/blogs")
      } else {
        alert(data.message || "Failed to create blog")
      }
    } catch (error) {
      console.error("Error creating blog:", error)
      alert("Failed to create blog. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="border-[#D9CFC7] text-[#4A2F1F]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A2F1F]">Create New Blog</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-[#D9CFC7] p-4 sm:p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-[#4A2F1F]">
              Blog Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog title"
              required
              className="border-[#D9CFC7] mt-1"
            />
          </div>

          <div>
            <Label htmlFor="excerpt" className="text-[#4A2F1F]">
              Excerpt * (Max 200 characters)
            </Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short description of the blog"
              required
              maxLength={200}
              rows={2}
              className="border-[#D9CFC7] mt-1"
            />
            <p className="text-xs text-foreground mt-1">{formData.excerpt.length}/200 characters</p>
          </div>

          <div>
            <Label htmlFor="content" className="text-[#4A2F1F]">
              Content *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your blog content here..."
              required
              rows={12}
              className="border-[#D9CFC7] mt-1"
            />
          </div>

          <div>
            <Label htmlFor="image" className="text-[#4A2F1F]">
              Blog Image *
            </Label>
            <div className="mt-1">
              {imagePreview ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-[#D9CFC7]">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview("")
                      setFormData({ ...formData, image: "" })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#D9CFC7] rounded-lg cursor-pointer hover:bg-[#F5F1ED]/50">
                  <Upload className="h-12 w-12 text-foreground mb-2" />
                  <p className="text-sm text-foreground">Click to upload image</p>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    required
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="author" className="text-[#4A2F1F]">
                Author *
              </Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Author name"
                required
                className="border-[#D9CFC7] mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-[#4A2F1F]">
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="border-[#D9CFC7] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sleep Tips">Sleep Tips</SelectItem>
                  <SelectItem value="Product News">Product News</SelectItem>
                  <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                  <SelectItem value="Company News">Company News</SelectItem>
                  <SelectItem value="Guides">Guides</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags" className="text-[#4A2F1F]">
              Tags (comma separated)
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. sleep, wellness, tips"
              className="border-[#D9CFC7] mt-1"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked as boolean })}
              />
              <Label htmlFor="published" className="text-[#4A2F1F] cursor-pointer">
                Publish immediately
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
              />
              <Label htmlFor="featured" className="text-[#4A2F1F] cursor-pointer">
                Featured blog
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#D9CFC7]">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-[#D9CFC7] text-[#4A2F1F]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:bg-black/90">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Blog"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
