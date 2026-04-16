import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { generateToken } from "@/lib/jwt"
import { normalizePhoneNumber } from "@/lib/msz91"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { email, phone, otp, rememberMe } = await request.json()

    // Validate input
    if (!otp) {
      return NextResponse.json({ success: false, message: "OTP is required" }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json({ success: false, message: "Email or phone is required" }, { status: 400 })
    }

    // Connect to database
    await connectDB()

    // Find user
    let user
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() })
      console.log(`[v0] Looking up user by email: ${email}`)
    } else if (phone) {
      // Normalize phone number before lookup
      const normalizedPhone = normalizePhoneNumber(phone)
      console.log(`[v0] Looking up user by phone. Original: ${phone}, Normalized: ${normalizedPhone}`)
      const phoneCandidates = [normalizedPhone]
      if (normalizedPhone.startsWith("91")) {
        phoneCandidates.push(normalizedPhone.slice(2))
      }
      user = await User.findOne({ phone: { $in: phoneCandidates } })
    }

    if (!user) {
      console.error(`[v0] No user found for verification`)
      return NextResponse.json({ success: false, message: "No account found. Please request OTP first." }, { status: 404 })
    }

    console.log(`[v0] User found: ${user._id}, Email: ${user.email}, Phone: ${user.phone}`)


    // Check OTP
    if (!user.otpCode || user.otpCode !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 401 })
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 401 },
      )
    }

    // For phone-based OTP, update user details if they're still placeholder values
    if (phone && user.otpMethod === "phone") {
      // User can provide full name during first login verification
      // For now, keep the placeholder, full name can be updated in profile later
      if (user.fullname === "Phone User") {
        // Keep as is - user can update in profile section
      }
    }



    // Generate authentication token
    const token = generateToken(
      {
        userId: user._id.toString(),
        email: user.email,
        fullname: user.fullname,
        id: undefined
      },
      rememberMe,
    )

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 200 },
    )

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 2 // 30 days or 2 hours
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("[VERIFY_OTP_ERROR]", error)
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
