import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import connectDB from "@/lib/mongodb"
import Fabric from "@/models/Fabric"

export const runtime = "nodejs"

function isFileLike(value: unknown): value is File {
  if (!value || typeof value !== "object") return false
  return typeof (value as any).arrayBuffer === "function"
}

// GET - Fetch all fabrics
export async function GET() {
  try {
    await connectDB()
    const fabrics = await Fabric.find().sort({ createdAt: -1 }).lean()
    
    return NextResponse.json(
      {
        success: true,
        fabrics: fabrics.map((fabric: any) => ({
          id: fabric.id,
          name: fabric.name,
          image: fabric.image,
          pattern: fabric.pattern || "pattern-solid",
        })),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] FABRICS_FETCH_ERROR:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch fabrics" },
      { status: 500 }
    )
  }
}

// POST - Create new fabric
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type")
    let name: string
    let id: string
    let pattern = "pattern-solid"
    let imageFile: File | null = null

    if (contentType?.includes("application/json")) {
      // Handle JSON request
      const body = await request.json()
      name = body.name
      id = body.id
      pattern = body.pattern || "pattern-solid"
    } else if (contentType?.includes("multipart/form-data")) {
      // Handle FormData request
      const formData = await request.formData()
      name = formData.get("name") as string
      id = formData.get("id") as string
      pattern = (formData.get("pattern") as string) || "pattern-solid"
      imageFile = formData.get("image") as File | null
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid content type" },
        { status: 400 }
      )
    }

    if (!name || !id) {
      return NextResponse.json(
        { success: false, message: "Fabric name and ID are required" },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if fabric already exists
    const existingFabric = await Fabric.findOne({ $or: [{ id }, { name }] })
    if (existingFabric) {
      return NextResponse.json(
        { success: false, message: "Fabric with this name or ID already exists" },
        { status: 400 }
      )
    }

    let imageUrl = ""

    // Upload image if provided
    if (imageFile && isFileLike(imageFile)) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          {
            success: false,
            message: "Image storage is not configured",
          },
          { status: 500 }
        )
      }

      const timestamp = Date.now()
      const filename = `fabrics/${timestamp}_${imageFile.name}`

      try {
        const blob = await put(filename, imageFile, {
          access: "public",
          addRandomSuffix: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        imageUrl = blob.url
      } catch (uploadError: any) {
        console.error("[v0] Error uploading fabric image:", uploadError)
        return NextResponse.json(
          {
            success: false,
            message: `Failed to upload image: ${uploadError.message || "Unknown error"}`,
          },
          { status: 500 }
        )
      }
    }

    const fabric = await Fabric.create({
      name: name.trim(),
      id: id.trim(),
      image: imageUrl,
      pattern: pattern,
    })

    console.log("[v0] Fabric created successfully:", fabric._id)

    return NextResponse.json(
      {
        success: true,
        message: "Fabric created successfully",
        fabric: {
          id: fabric.id,
          name: fabric.name,
          image: fabric.image,
          pattern: fabric.pattern,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[v0] FABRIC_CREATE_ERROR:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create fabric" },
      { status: 500 }
    )
  }
}
