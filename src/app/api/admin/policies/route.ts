import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Policy, { type PolicyType } from "@/models/Policy"

const VALID_TYPES: PolicyType[] = ["privacy", "terms", "refund", "shipping"]

const isValidPolicyType = (value: string | null | undefined): value is PolicyType => {
  return Boolean(value && VALID_TYPES.includes(value as PolicyType))
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (!isValidPolicyType(type)) {
      return NextResponse.json(
        { success: false, message: "Valid policy type is required" },
        { status: 400 },
      )
    }

    const policy = await Policy.findOne({ type }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      policy: policy || null,
      exists: Boolean(policy),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error fetching policy:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch policy", error: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { type, title, content, sections } = body as {
      type?: string
      title?: string
      content?: string
      sections?: Array<{ heading: string; description: string }>
    }

    if (!isValidPolicyType(type)) {
      return NextResponse.json(
        { success: false, message: "Valid policy type is required" },
        { status: 400 },
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 },
      )
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: "Content is required" },
        { status: 400 },
      )
    }

    const existingPolicy = await Policy.findOne({ type })
    if (existingPolicy) {
      return NextResponse.json(
        { success: false, message: `A ${type} policy already exists. Use update instead.` },
        { status: 400 },
      )
    }

    const policy = await Policy.create({
      type,
      title: title.trim(),
      content: content.trim(),
      sections: sections || [],
      lastUpdated: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `${type} policy created successfully`,
      policy,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error creating policy:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create policy", error: errorMessage },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { type, title, content, sections } = body as {
      type?: string
      title?: string
      content?: string
      sections?: Array<{ heading: string; description: string }>
    }

    if (!isValidPolicyType(type)) {
      return NextResponse.json(
        { success: false, message: "Valid policy type is required" },
        { status: 400 },
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 },
      )
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: "Content is required" },
        { status: 400 },
      )
    }

    const policy = await Policy.findOneAndUpdate(
      { type },
      {
        title: title.trim(),
        content: content.trim(),
        sections: sections || [],
        lastUpdated: new Date(),
      },
      { new: true },
    )

    if (!policy) {
      return NextResponse.json(
        { success: false, message: `${type} policy not found` },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `${type} policy updated successfully`,
      policy,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error updating policy:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update policy", error: errorMessage },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (!isValidPolicyType(type)) {
      return NextResponse.json(
        { success: false, message: "Valid policy type is required" },
        { status: 400 },
      )
    }

    const policy = await Policy.findOneAndDelete({ type })

    if (!policy) {
      return NextResponse.json(
        { success: false, message: `${type} policy not found` },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `${type} policy deleted successfully`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error deleting policy:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete policy", error: errorMessage },
      { status: 500 },
    )
  }
}
