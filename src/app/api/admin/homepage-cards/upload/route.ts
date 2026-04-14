import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 },
      )
    }

    const name = file.name.toLowerCase()
    const looseType = file.type === "" || file.type === "application/octet-stream"
    const isGif = file.type === "image/gif" || (looseType && name.endsWith(".gif"))
    const isMp4 =
      file.type === "video/mp4" || file.type.startsWith("video/mp4;") || (looseType && name.endsWith(".mp4"))

    if (!isGif && !isMp4) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload a GIF (.gif) or MP4 (.mp4) file",
        },
        { status: 400 },
      )
    }

    const filename = `homepage-cards/${Date.now()}-${file.name}`

    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        url: blob.url,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Error uploading homepage card image:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload image",
      },
      { status: 500 },
    )
  }
}
