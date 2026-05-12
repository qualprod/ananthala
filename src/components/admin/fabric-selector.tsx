"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { fabricOptions } from "@/data/fabric"
import { getAllFabricPatterns } from "@/data/fabric-patterns"
import { PatternIcon } from "@/components/admin/pattern-icon"

interface Fabric {
  id: string
  name: string
  image?: string
  pattern?: string
}

interface FabricSelectorProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  htmlFor?: string
  triggerClassName?: string
  showAddOption?: boolean
}

export function FabricSelector({
  value,
  onValueChange,
  label = "Fabric",
  htmlFor = "fabric",
  triggerClassName = "h-12 bg-white border-[#D9CFC7] text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold",
  showAddOption = true,
}: FabricSelectorProps) {
  const [allFabrics, setAllFabrics] = useState<Fabric[]>(fabricOptions)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newFabricName, setNewFabricName] = useState("")
  const [newFabricId, setNewFabricId] = useState("")
  const [newFabricPattern, setNewFabricPattern] = useState("pattern-solid")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const allPatterns = getAllFabricPatterns()

  // Fetch dynamic fabrics from database
  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        const response = await fetch("/api/fabrics")
        const data = await response.json()
        if (data.success && Array.isArray(data.fabrics)) {
          // Combine static and dynamic fabrics, removing duplicates
          const dynamicFabrics = data.fabrics.filter(
            (f: Fabric) => !fabricOptions.some((sf) => sf.id === f.id)
          )
          setAllFabrics([...fabricOptions, ...dynamicFabrics])
        }
      } catch (error) {
        console.error("[v0] Error fetching fabrics:", error)
      }
    }
    fetchFabrics()
  }, [])

  const handleAddFabric = async () => {
    if (!newFabricName.trim() || !newFabricId.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate ID
    if (allFabrics.some((f) => f.id === newFabricId)) {
      toast({
        title: "Error",
        description: "This Fabric ID already exists",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/fabrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newFabricId,
          name: newFabricName,
          pattern: newFabricPattern,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const newFabric = { 
          id: newFabricId, 
          name: newFabricName,
          pattern: newFabricPattern
        }
        setAllFabrics((prev) => [...prev, newFabric])
        onValueChange(newFabricId)
        setNewFabricName("")
        setNewFabricId("")
        setNewFabricPattern("pattern-solid")
        setIsAddDialogOpen(false)
        toast({
          title: "Success",
          description: "Fabric added successfully",
        })
      } else {
        throw new Error(data.message || "Failed to add fabric")
      }
    } catch (error) {
      console.error("[v0] Error adding fabric:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add fabric",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm text-[#6D4530] sm:text-base font-medium">
        {label}
      </Label>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <Select value={value || ""} onValueChange={onValueChange}>
          <SelectTrigger id={htmlFor} className={triggerClassName}>
            <SelectValue placeholder="Select fabric" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#D9CFC7]">
            {allFabrics.map((fabric) => {
              const pattern = fabric.pattern ? allPatterns.find(p => p.id === fabric.pattern) : null
              return (
                <SelectItem key={fabric.id} value={fabric.id} className="text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    {fabric.image ? (
                      <img
                        src={fabric.image}
                        alt={fabric.name}
                        className="h-4 w-4 sm:h-5 sm:w-5 rounded object-cover"
                      />
                    ) : pattern ? (
                      <PatternIcon patternId={fabric.pattern} size="sm" />
                    ) : null}
                    <span>{fabric.name}</span>
                    {pattern && (
                      <span className="text-xs text-gray-400 ml-1">({pattern.name})</span>
                    )}
                  </div>
                </SelectItem>
              )
            })}
            {showAddOption && <div className="border-t border-[#D9CFC7] my-1" />}
            {showAddOption && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsAddDialogOpen(true)
                }}
                className="w-full px-3 py-2 text-sm sm:text-base text-left text-[#8B5A3C] hover:bg-[#FFF5E6] flex items-center gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                Add New Fabric
              </button>
            )}
          </SelectContent>
        </Select>
        {showAddOption && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="icon"
            className="h-10 w-10 sm:h-12 sm:w-12 bg-[#8B5A3C] hover:bg-[#6D4530] flex-shrink-0"
            title="Add new fabric"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Add Fabric Dialog - Properly Responsive */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-0 gap-0 rounded-lg border border-[#D9CFC7] bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D9CFC7] px-4 sm:px-6 py-3 sm:py-4">
            <DialogTitle className="text-base sm:text-lg font-semibold text-[#6D4530]">
              Add New Fabric
            </DialogTitle>
            <DialogClose className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100">
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-[#6D4530]" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fabric-name" className="text-sm sm:text-base text-[#6D4530] font-medium">
                Fabric Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="fabric-name"
                placeholder="e.g., Premium Velvet"
                value={newFabricName}
                onChange={(e) => setNewFabricName(e.target.value)}
                className="h-9 sm:h-10 text-sm sm:text-base border-[#D9CFC7] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                disabled={isSubmitting}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">Display name for the fabric</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fabric-id" className="text-sm sm:text-base text-[#6D4530] font-medium">
                Fabric ID<span className="text-red-500">*</span>
              </Label>
              <Input
                id="fabric-id"
                placeholder="e.g., premium-velvet"
                value={newFabricId}
                onChange={(e) => setNewFabricId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="h-9 sm:h-10 text-sm sm:text-base border-[#D9CFC7] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                disabled={isSubmitting}
                maxLength={30}
              />
              <p className="text-xs text-gray-500">Unique identifier (lowercase, hyphens allowed)</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fabric-pattern" className="text-sm sm:text-base text-[#6D4530] font-medium">
                Pattern Design<span className="text-red-500">*</span>
              </Label>
              <Select value={newFabricPattern} onValueChange={setNewFabricPattern}>
                <SelectTrigger 
                  id="fabric-pattern" 
                  className="h-9 sm:h-10 text-sm sm:text-base border-[#D9CFC7] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                  disabled={isSubmitting}
                >
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D9CFC7]">
                  {allPatterns.map((pattern) => (
                    <SelectItem key={pattern.id} value={pattern.id} className="text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        <PatternIcon patternId={pattern.id} size="sm" />
                        <span>{pattern.name}</span>
                        <span className="text-xs text-gray-400">({pattern.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Choose the default pattern for this fabric</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-[#D9CFC7] bg-gray-50">
            <Button
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1 h-9 sm:h-10 text-sm sm:text-base border-[#D9CFC7] text-[#6D4530] hover:bg-[#FFF5E6]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFabric}
              disabled={isSubmitting || !newFabricName.trim() || !newFabricId.trim()}
              className="flex-1 h-9 sm:h-10 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-medium text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
