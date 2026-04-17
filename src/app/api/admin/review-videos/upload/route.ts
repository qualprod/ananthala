import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse form data without strict content-type check
    // FormData sends multipart/form-data with boundary parameter
    let formData
    try {
      formData = await request.formData()
    } catch (parseError: any) {
      console.error("[v0] FormData parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to parse form data",
        },
        { status: 400 },
      )
    }

    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 },
      )
    }

    // Validate file
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file object",
        },
        { status: 400 },
      )
    }

    // Check file size (20MB limit - optimized for Vercel serverless and storage efficiency)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File size exceeds 20MB limit. Please upload a smaller video.",
        },
        { status: 413 },
      )
    }

    // Check file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Expected video file",
        },
        { status: 400 },
      )
    }

    const filename = `review-videos/${Date.now()}-${file.name}`

    let blob
    try {
      blob = await put(filename, file, {
        access: "public",
      })
    } catch (blobError: any) {
      console.error("[v0] Blob upload error:", blobError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload to storage service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Video uploaded successfully",
        url: blob.url,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Unexpected error in upload route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
