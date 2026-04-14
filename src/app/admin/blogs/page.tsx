"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { Plus, RefreshCw, Trash2, Loader2, Edit, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface Blog {
  _id: string
  title: string
  content: string
  excerpt: string
  image: string
  author: string
  category: string
  tags: string[]
  slug: string
  published: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

function BlogManagementContent() {
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchBlogs = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/admin/blogs")
      const data = await response.json()

      if (data.success) {
        setBlogs(data.blogs)
      }
    } catch (error) {
      console.error("Error fetching blogs:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  const handleRefresh = () => {
    fetchBlogs()
  }

  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== blogId))
        alert("Blog deleted successfully!")
      } else {
        alert(data.message || "Failed to delete blog")
      }
    } catch (error) {
      console.error("Error deleting blog:", error)
      alert("Failed to delete blog. Please try again.")
    }
  }

  const handleTogglePublish = async (blogId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !currentStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setBlogs((prev) => prev.map((b) => (b._id === blogId ? { ...b, published: !currentStatus } : b)))
        alert(`Blog ${!currentStatus ? "published" : "unpublished"} successfully!`)
      } else {
        alert(data.message || "Failed to update blog status")
      }
    } catch (error) {
      console.error("Error updating blog:", error)
      alert("Failed to update blog status. Please try again.")
    }
  }

  const filteredBlogs = selectedCategory === "all" ? blogs : blogs.filter((b) => b.category === selectedCategory)

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A2F1F]">Blog Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#D9CFC7] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#4A2F1F]">
            Blogs ({filteredBlogs.length} blog{filteredBlogs.length !== 1 ? "s" : ""})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] border-[#D9CFC7]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Sleep Tips">Sleep Tips</SelectItem>
                <SelectItem value="Product News">Product News</SelectItem>
                <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                <SelectItem value="Company News">Company News</SelectItem>
                <SelectItem value="Guides">Guides</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-[#D9CFC7] text-[#4A2F1F] hover:bg-[#8B5A3C]/10 bg-transparent font-medium"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              className="bg-black text-white hover:bg-black/90 font-medium"
              onClick={() => router.push("/admin/blogs/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Blog
            </Button>
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9CFC7]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Image</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Title</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Author</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBlogs.map((blog) => (
                <tr key={blog._id} className="border-b border-[#D9CFC7] hover:bg-[#F5F1ED]/50">
                  <td className="py-4 px-4">
                    <img
                      src={blog.image || "/placeholder.svg"}
                      alt={blog.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-[#4A2F1F] max-w-xs truncate">{blog.title}</div>
                    <div className="text-sm text-foreground mt-0.5 max-w-xs truncate">{blog.excerpt}</div>
                  </td>
                  <td className="py-4 px-4 text-foreground font-medium">{blog.category}</td>
                  <td className="py-4 px-4 text-[#4A2F1F]">{blog.author}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        blog.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {blog.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#4A2F1F]">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground hover:bg-[#8B5A3C]/10"
                        onClick={() => router.push(`/admin/blogs/edit/${blog._id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${blog.published ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}`}
                        onClick={() => handleTogglePublish(blog._id, blog.published)}
                      >
                        {blog.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(blog._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-4">
          {paginatedBlogs.map((blog) => (
            <div key={blog._id} className="border border-[#D9CFC7] rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <img
                  src={blog.image || "/placeholder.svg"}
                  alt={blog.title}
                  className="w-20 h-16 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#4A2F1F] truncate">{blog.title}</h3>
                  <p className="text-sm text-foreground truncate">{blog.excerpt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-foreground">{blog.category}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        blog.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {blog.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#D9CFC7]">
                <span className="text-xs text-foreground">
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground hover:bg-[#8B5A3C]/10"
                    onClick={() => router.push(`/admin/blogs/edit/${blog._id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${blog.published ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}`}
                    onClick={() => handleTogglePublish(blog._id, blog.published)}
                  >
                    {blog.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(blog._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground font-medium">
              {selectedCategory === "all"
                ? "No blogs found. Create your first blog to get started!"
                : `No ${selectedCategory} blogs found.`}
            </p>
          </div>
        )}

        {filteredBlogs.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D9CFC7]">
            <p className="text-sm text-[#4A2F1F] font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredBlogs.length)} of {filteredBlogs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-[#D9CFC7] text-[#4A2F1F] disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="text-sm text-[#4A2F1F] font-medium px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-[#D9CFC7] text-[#4A2F1F] disabled:opacity-50"
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

export default function BlogManagementPage() {
  return (
    <Suspense fallback={null}>
      <BlogManagementContent />
    </Suspense>
  )
}
