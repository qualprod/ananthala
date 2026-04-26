"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Shield, Plus, X, Eye, Pencil, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type PolicyType = "privacy" | "terms" | "refund" | "shipping"
type ViewMode = "list" | "create" | "edit" | "preview"

interface Section {
  heading: string
  description: string
}

interface Policy {
  _id?: string
  type?: PolicyType
  title: string
  content: string
  sections: Section[]
  lastUpdated?: string
  createdAt?: string
}

interface PolicyManagementFormProps {
  type: PolicyType
  policyLabel: string
  defaultTitle: string
}

export function PolicyManagementForm({ type, policyLabel, defaultTitle }: PolicyManagementFormProps) {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [formData, setFormData] = useState<Policy>({
    title: defaultTitle,
    content: "",
    sections: [],
  })
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newSection, setNewSection] = useState<Section>({ heading: "", description: "" })

  const fetchPolicy = async () => {
    try {
      setIsFetching(true)
      const response = await fetch(`/api/admin/policies?type=${type}`)
      const data = await response.json()

      if (data.success && data.policy) {
        setPolicy(data.policy)
        setFormData({
          _id: data.policy._id,
          type: data.policy.type,
          title: data.policy.title || defaultTitle,
          content: data.policy.content || "",
          sections: data.policy.sections || [],
          lastUpdated: data.policy.lastUpdated,
          createdAt: data.policy.createdAt,
        })
      } else {
        setPolicy(null)
      }
    } catch (error) {
      console.error(`Error fetching ${type} policy:`, error)
      toast.error(`Failed to load ${policyLabel}`)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchPolicy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const handleAddSection = () => {
    if (!newSection.heading.trim() || !newSection.description.trim()) {
      toast.error("Please fill section heading and description")
      return
    }
    setFormData((prev) => ({ ...prev, sections: [...prev.sections, { ...newSection }] }))
    setNewSection({ heading: "", description: "" })
  }

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/policies", {
        method: policy ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: formData.title,
          content: formData.content,
          sections: formData.sections,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        toast.error(data.message || `Failed to save ${policyLabel}`)
        return
      }
      toast.success(`${policyLabel} saved successfully`)
      setViewMode("list")
      await fetchPolicy()
    } catch (error) {
      console.error(`Error saving ${type} policy:`, error)
      toast.error(`Failed to save ${policyLabel}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/policies?type=${type}`, { method: "DELETE" })
      const data = await response.json()
      if (!data.success) {
        toast.error(data.message || `Failed to delete ${policyLabel}`)
        return
      }
      toast.success(`${policyLabel} deleted successfully`)
      setPolicy(null)
      setFormData({ title: defaultTitle, content: "", sections: [] })
      setViewMode("list")
    } catch (error) {
      console.error(`Error deleting ${type} policy:`, error)
      toast.error(`Failed to delete ${policyLabel}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner className="h-8 w-8 text-[#8B5A3C]" />
        <p className="text-[#8B5A3C]/70">Loading {policyLabel.toLowerCase()}...</p>
      </div>
    )
  }

  if (viewMode === "preview" && policy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#6D4530]">Policy Preview</h2>
          <Button variant="outline" onClick={() => setViewMode("list")} className="border-[#D9CFC7] text-[#6D4530]">
            Back to List
          </Button>
        </div>
        <Card className="border-[#E5D5C5] bg-white">
          <CardContent className="p-8 space-y-6">
            <h1 className="text-3xl font-bold text-[#6D4530]">{policy.title}</h1>
            <p className="text-sm text-[#8B5A3C]/70">
              Last Updated: {policy.lastUpdated ? new Date(policy.lastUpdated).toLocaleString() : "N/A"}
            </p>
            <p className="text-[#6D4530] whitespace-pre-wrap">{policy.content}</p>
            {policy.sections.map((section, index) => (
              <div key={`${section.heading}-${index}`} className="border-l-4 border-[#8B5A3C]/30 pl-4">
                <h3 className="text-xl font-semibold text-[#6D4530]">{section.heading}</h3>
                <p className="text-[#6D4530]/80 whitespace-pre-wrap">{section.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-[#E5D5C5] bg-white">
          <CardHeader>
            <CardTitle className="text-[#6D4530] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewMode === "create" ? `Create ${policyLabel}` : `Edit ${policyLabel}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Policy title"
            />
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Policy content"
              className="min-h-40"
            />
          </CardContent>
        </Card>

        <Card className="border-[#E5D5C5] bg-white">
          <CardHeader>
            <CardTitle className="text-[#6D4530]">Sections</CardTitle>
            <CardDescription>Add detailed policy sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.sections.map((section, index) => (
              <div key={`${section.heading}-${index}`} className="space-y-2 p-3 rounded border border-[#D9CFC7]">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Section {index + 1}</Badge>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSection(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={section.heading}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const sections = [...prev.sections]
                      sections[index] = { ...sections[index], heading: e.target.value }
                      return { ...prev, sections }
                    })
                  }
                  placeholder="Section heading"
                />
                <Textarea
                  value={section.description}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const sections = [...prev.sections]
                      sections[index] = { ...sections[index], description: e.target.value }
                      return { ...prev, sections }
                    })
                  }
                  placeholder="Section description"
                />
              </div>
            ))}

            <div className="space-y-2 p-3 rounded border border-dashed border-[#D9CFC7]">
              <Input
                value={newSection.heading}
                onChange={(e) => setNewSection((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="New section heading"
              />
              <Textarea
                value={newSection.description}
                onChange={(e) => setNewSection((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="New section description"
              />
              <Button type="button" variant="outline" onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setViewMode("list")} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1 bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
            {isLoading ? "Saving..." : "Save Policy"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {!policy ? (
        <Card className="border-[#E5D5C5] bg-white">
          <CardContent className="p-10 text-center">
            <Shield className="h-10 w-10 text-[#8B5A3C] mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-[#6D4530] mb-2">No {policyLabel} Found</h3>
            <Button onClick={() => setViewMode("create")} className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create {policyLabel}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E5D5C5] bg-white">
          <CardHeader>
            <CardTitle className="text-[#6D4530]">Current {policyLabel}</CardTitle>
            <CardDescription>Update or replace this policy anytime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#6D4530]">{policy.title}</p>
                <p className="text-sm text-[#8B5A3C]/70">
                  {policy.sections.length} sections • Updated{" "}
                  {policy.lastUpdated ? new Date(policy.lastUpdated).toLocaleString() : "N/A"}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("preview")}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("edit")}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {policyLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
