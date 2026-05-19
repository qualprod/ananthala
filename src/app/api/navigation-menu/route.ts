import { connectDB } from "@/lib/mongodb"
import { syncNavigationMenu } from "@/lib/navigation-menu-sync"
import { NavigationMenu } from "@/models/navigationMenu"
import { NextResponse } from "next/server"

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
