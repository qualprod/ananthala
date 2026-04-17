import { connectDB } from "@/lib/mongodb"
import { HomepageCard } from "@/models/homepageCard"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { backgroundUrl, name, tagline } = body

    if (!backgroundUrl && !name && !tagline) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field (name, tagline, or backgroundUrl) is required",
        },
        { status: 400 },
      )
    }

    const updateData: Record<string, string> = {}
    if (typeof backgroundUrl === "string" && backgroundUrl.trim().length > 0) {
      updateData.backgroundUrl = backgroundUrl
    }
    if (typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim()
    }
    if (typeof tagline === "string") {
      updateData.tagline = tagline.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Provided fields are invalid",
        },
        { status: 400 },
      )
    }

    const card = await HomepageCard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    )

    if (!card) {
      return NextResponse.json(
        {
          success: false,
          message: "Homepage card not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Homepage card updated successfully",
        data: card,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error updating homepage card:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update homepage card",
      },
      { status: 500 },
    )
  }
}
