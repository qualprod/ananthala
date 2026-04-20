import { connectDB } from "@/lib/mongodb"
import { DEFAULT_NAVIGATION_MENU_ITEMS } from "@/lib/navigation-menu-defaults"
import { NavigationMenu } from "@/models/navigationMenu"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()

    let menuItems = await NavigationMenu.find().sort({ displayOrder: 1, createdAt: 1 })

    // Seed defaults once so the menu is editable from admin immediately.
    if (menuItems.length === 0) {
      menuItems = await NavigationMenu.insertMany(DEFAULT_NAVIGATION_MENU_ITEMS)
      menuItems = [...menuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    }

    return NextResponse.json(
      {
        success: true,
        data: menuItems,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error fetching navigation menu:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch navigation menu",
      },
      { status: 500 },
    )
  }
}
