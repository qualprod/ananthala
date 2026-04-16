import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"
import { withCountryCode } from "@/lib/phone"

export const runtime = "nodejs"

// GET - Fetch user profile data
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone || "",
        addresses: user.addresses || [],
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("[PROFILE_GET_ERROR]", error)
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    const { phone, addresses } = await request.json()

    await connectDB()

    const user = await User.findById(decoded.userId)

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    user.phone = phone?.trim() ? withCountryCode(phone) : ""
    
    // Validate maximum 3 addresses
    if (Array.isArray(addresses) && addresses.length > 3) {
      return NextResponse.json({ 
        success: false, 
        message: "Maximum 3 addresses allowed" 
      }, { status: 400 })
    }
    
    // Process addresses with proper validation
    if (Array.isArray(addresses)) {
      user.addresses = addresses.map((addr: any) => ({
        _id: addr._id || new mongoose.Types.ObjectId(),
        label: addr.label,
        houseNumber: addr.houseNumber?.trim() || "",
        crossStreet: addr.crossStreet?.trim() || "",
        locality: addr.locality?.trim() || "",
        landmark: addr.landmark?.trim() || "",
        city: addr.city?.trim() || "",
        state: addr.state?.trim() || "",
        pincode: addr.pincode?.trim() || "",
        country: addr.country?.trim() || "India",
        isDefault: addr.isDefault || false,
        latitude: addr.latitude || null,
        longitude: addr.longitude || null,
      }))

      // Ensure only one default address
      let hasDefault = false
      for (let i = 0; i < user.addresses.length; i++) {
        if (user.addresses[i].isDefault && !hasDefault) {
          hasDefault = true
        } else {
          user.addresses[i].isDefault = false
        }
      }
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("[PROFILE_UPDATE_ERROR]", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to update profile" }, { status: 500 })
  }
}
