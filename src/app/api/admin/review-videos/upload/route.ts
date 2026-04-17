import { connectDB } from "@/lib/mongodb"
import { ReviewVideo } from "@/models/reviewVideo"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()

    const videos = await ReviewVideo.find().sort({ displayOrder: 1, createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: videos,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error fetching review videos:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch review videos",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { title, description, blobUrl, customerName, thumbnail } = body

    if (!title || !blobUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and video URL are required",
        },
        { status: 400 },
      )
    }

    const lastVideo = await ReviewVideo.findOne().sort({ displayOrder: -1 })
    const displayOrder = (lastVideo?.displayOrder || 0) + 1

    const newVideo = new ReviewVideo({
      title,
      description,
      blobUrl,
      videoUrl: blobUrl,
      customerName,
      thumbnail,
      displayOrder,
    })

    await newVideo.save()

    return NextResponse.json(
      {
        success: true,
        message: "Review video created successfully",
        data: newVideo,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[v0] Error creating review video:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create review video",
      },
      { status: 500 },
    )
  }
}
