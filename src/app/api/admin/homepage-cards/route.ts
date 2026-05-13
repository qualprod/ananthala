import { connectDB } from "@/lib/mongodb"
import { HomepageCard } from "@/models/homepageCard"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()

    await HomepageCard.updateMany(
      { name: { $regex: /bedsheets?,\s*pillows?\s*and\s*more/i } },
      { $set: { name: "Curated Essentials", tagline: "" } },
    )

    const cards = await HomepageCard.find().sort({ displayOrder: 1, createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: cards,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error fetching homepage cards:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch homepage cards",
      },
      { status: 500 },
    )
  }
}

