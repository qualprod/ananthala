import { connectDB } from "@/lib/mongodb"
import { ReviewVideo } from "@/models/reviewVideo"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()

    const videos = await ReviewVideo.find().sort({ displayOrder: 1, createdAt: -1 })

    // Convert MongoDB documents to plain objects to avoid serialization issues
    const plainVideos = videos.map((video) => video.toObject())

    return NextResponse.json(
      {
        success: true,
        data: plainVideos,
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
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error("[v0] JSON parse error:", parseError.message)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body. Please ensure all fields are properly formatted.",
        },
        { status: 400 }
      )
    }

    const { title, description, blobUrl, customerName, thumbnail } = body

    if (!title || !blobUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and video URL are required",
        },
        { status: 400 }
      )
    }

    await connectDB()

    const lastVideo = await ReviewVideo.findOne().sort({ displayOrder: -1 })
    const displayOrder = (lastVideo?.displayOrder || 0) + 1

    const newVideo = new ReviewVideo({
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      blobUrl: String(blobUrl).trim(),
      videoUrl: String(blobUrl).trim(),
      customerName: customerName ? String(customerName).trim() : "",
      thumbnail: thumbnail ? String(thumbnail).trim() : "",
      displayOrder,
      isActive: true,
    })

    await newVideo.save()

    const savedVideo = newVideo.toObject()

    return NextResponse.json(
      {
        success: true,
        message: "Review video created successfully",
        data: savedVideo,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[v0] Error creating review video:", error.message)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create review video",
      },
      { status: 500 }
    )
  }
}
