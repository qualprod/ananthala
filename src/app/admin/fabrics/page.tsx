"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Plus, Loader2 } from "lucide-react"

interface Fabric {
  id: string
  name: string
  image?: string
}

export default function AdminFabricsPage() {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    imageFile: null as File | null,
    imagePreview: "",
  })
  const { toast } = useToast()

  // Fetch fabrics on mount
  useEffect(() => {
    fetchFabrics()
  }, [])

  const fetchFabrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/fabrics")
      const data = await response.json()
      if (data.success) {
        setFabrics(data.fabrics || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching fabrics:", error)
      toast({
        title: "Error",
        description: "Failed to load fabrics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.id.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAdding(true)
      const data = new FormData()
      data.append("name", formData.name.trim())
      data.append("id", formData.id.trim())
      if (formData.imageFile) {
        data.append("image", formData.imageFile)
      }

      const response = await fetch("/api/fabrics", {
        method: "POST",
        body: data,
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Fabric added successfully",
        })
        setFormData({
          name: "",
          id: "",
          imageFile: null,
          imagePreview: "",
        })
        fetchFabrics()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add fabric",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error adding fabric:", error)
      toast({
        title: "Error",
        description: "Failed to add fabric",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (fabricId: string) => {
    if (!confirm("Are you sure you want to delete this fabric?")) return

    try {
      const response = await fetch(`/api/fabrics/${fabricId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Fabric deleted successfully",
        })
        fetchFabrics()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete fabric",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting fabric:", error)
      toast({
        title: "Error",
        description: "Failed to delete fabric",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">Manage Fabrics</h1>

        {/* Add Fabric Form */}
        <div className="bg-white border border-[#E5D5C5] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Add New Fabric</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fabric Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Gingham Blue"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fabric ID *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., gingham-blue"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, id: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fabric Image
              </label>
              <div className="flex gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {formData.imagePreview && (
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded border border-[#E5D5C5]"
                  />
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isAdding}
              className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white w-full md:w-auto"
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Fabric
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Fabrics List */}
        <div className="bg-white border border-[#E5D5C5] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Available Fabrics</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#8B5A3C]" />
            </div>
          ) : fabrics.length === 0 ? (
            <p className="text-center text-foreground/70 py-8">
              No fabrics added yet. Create your first fabric above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fabrics.map((fabric) => (
                <div
                  key={fabric.id}
                  className="border border-[#E5D5C5] rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {fabric.image && (
                    <img
                      src={fabric.image}
                      alt={fabric.name}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  )}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-semibold text-foreground">{fabric.name}</h3>
                    <p className="text-sm text-foreground/70 break-words">{fabric.id}</p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(fabric.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
