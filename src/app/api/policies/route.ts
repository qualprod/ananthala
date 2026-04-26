import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Policy, { type PolicyType } from "@/models/Policy"
import PrivacyPolicy from "@/models/PrivacyPolicy"

const VALID_TYPES: PolicyType[] = ["privacy", "terms", "refund", "shipping"]

const isValidPolicyType = (value: string | null): value is PolicyType => {
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

    let policy = await Policy.findOne({ type }).lean()

    // Backward compatibility: use legacy privacy policy until migrated.
    if (!policy && type === "privacy") {
      const legacyPrivacyPolicy = await PrivacyPolicy.findOne().lean()
      if (legacyPrivacyPolicy) {
        policy = {
          ...legacyPrivacyPolicy,
          type: "privacy",
        } as any
      }
    }

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
