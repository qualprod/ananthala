import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Fabric from "@/models/Fabric"

export const runtime = "nodejs"

// DELETE - Remove a fabric
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fabricId = params.id

    if (!fabricId) {
      return NextResponse.json(
        { success: false, message: "Fabric ID is required" },
        { status: 400 }
      )
    }

    await connectDB()

    const fabric = await Fabric.findOneAndDelete({ id: fabricId })

    if (!fabric) {
      return NextResponse.json(
        { success: false, message: "Fabric not found" },
        { status: 404 }
      )
    }

    console.log("[v0] Fabric deleted successfully:", fabricId)

    return NextResponse.json(
      {
        success: true,
        message: "Fabric deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] FABRIC_DELETE_ERROR:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete fabric" },
      { status: 500 }
    )
  }
}
