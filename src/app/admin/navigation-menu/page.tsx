"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NavigationMenuItem {
  _id?: string
  label: string
  href: string
  isActive: boolean
  displayOrder: number
}

export default function NavigationMenuPage() {
  const [items, setItems] = useState<NavigationMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/navigation-menu")
      const data = await response.json()
      if (data.success) {
        setItems(data.data)
      } else {
        setError(data.message || "Failed to load navigation menu")
      }
    } catch (fetchError: any) {
      console.error("[v0] Error fetching admin navigation menu:", fetchError)
      setError(fetchError.message || "Failed to load navigation menu")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const saveItems = async () => {
    try {
      setSaving(true)
      setError(null)
      const payload = items.map((item) => ({
        _id: item._id,
        label: item.label,
      }))

      const response = await fetch("/api/admin/navigation-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      })
      const data = await response.json()

      if (data.success) {
        setItems(data.data)
        setSuccess("Navigation menu updated successfully")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || "Failed to save navigation menu")
      }
    } catch (saveError: any) {
      console.error("[v0] Error saving admin navigation menu:", saveError)
      setError(saveError.message || "Failed to save navigation menu")
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (index: number, updates: Partial<NavigationMenuItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-foreground">Loading menu items...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Navigation Menu</h1>
          <p className="text-foreground/70 mt-1">Edit only hamburger menu names. Links are fixed from backend.</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item._id || `new-${index}`} className="bg-white border border-[#D9CFC7] rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={item.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                placeholder="Menu label"
                className="border-[#D9CFC7] text-foreground"
              />
              <Input
                value={item.href}
                readOnly
                className="border-[#D9CFC7] text-foreground"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={saveItems} disabled={saving} className="bg-[#8B5A3C] hover:bg-[#6D4530] text-white">
          {saving ? "Saving..." : "Save Menu"}
        </Button>
      </div>
    </div>
  )
}
