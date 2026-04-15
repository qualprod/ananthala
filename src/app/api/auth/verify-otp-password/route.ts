import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 })
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if OTP exists and is not expired
    if (!user.otpCode || !user.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP not found. Please request a new OTP." },
        { status: 400 },
      )
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new OTP." },
        { status: 400 },
      )
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP. Please try again." }, { status: 400 })
    }

    // Clear OTP after successful verification
    user.otpCode = ""
    user.otpExpiry = null
    user.otpMethod = null
    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully. You can now reset your password.",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[VERIFY_OTP_PASSWORD_ERROR]", error)
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 })
  }
}
