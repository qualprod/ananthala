import { connectDB } from "@/lib/mongodb"
import { syncNavigationMenu } from "@/lib/navigation-menu-sync"
import { NavigationMenu } from "@/models/navigationMenu"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()

    const menuItems = await syncNavigationMenu(NavigationMenu)

    return NextResponse.json(
      {
        success: true,
        data: menuItems,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error fetching admin navigation menu:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch navigation menu",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one menu item is required",
        },
        { status: 400 },
      )
    }

    const existingItems = await NavigationMenu.find({}, { _id: 1, href: 1, isActive: 1, displayOrder: 1 })
    const existingById = new Map(existingItems.map((item) => [String(item._id), item]))

    const updates = items
      .map((item: any) => {
        const id = String(item?._id || "")
        const existing = existingById.get(id)
        if (!existing) return null
        const label = String(item?.label || "").trim()
        if (!label) return null
        return { id, label }
      })
      .filter((item): item is { id: string; label: string } => item !== null)

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid menu label updates provided",
        },
        { status: 400 },
      )
    }

    await Promise.all(
      updates.map((item) =>
        NavigationMenu.findByIdAndUpdate(item.id, {
          label: item.label,
        }),
      ),
    )
    const sorted = await NavigationMenu.find().sort({ displayOrder: 1, createdAt: 1 })

    return NextResponse.json(
      {
        success: true,
        message: "Navigation menu updated successfully",
        data: sorted,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error updating admin navigation menu:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update navigation menu",
      },
      { status: 500 },
    )
  }
}
