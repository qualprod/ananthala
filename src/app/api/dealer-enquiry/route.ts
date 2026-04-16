import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import DealerEnquiry from "@/models/DealerEnquiry"
import { withCountryCode } from "@/lib/phone"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("[v0] Dealer enquiry submission received")
    const { businessName, ownerName, email, phone, city, state, businessType, retailSpace, inventory, message } =
      await request.json()

    // Validate required fields
    if (
      !businessName ||
      !ownerName ||
      !email ||
      !phone ||
      !city ||
      !state ||
      !businessType ||
      !retailSpace ||
      !inventory
    ) {
      return NextResponse.json({ success: false, message: "All required fields must be filled" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // Validate enum fields
    const validBusinessTypes = ["furniture", "bedding", "home", "online", "other"]
    const validInventoryRanges = ["5-10", "10-20", "20-50", "50+"]

    if (!validBusinessTypes.includes(businessType)) {
      return NextResponse.json({ success: false, message: "Invalid business type" }, { status: 400 })
    }

    if (!validInventoryRanges.includes(inventory)) {
      return NextResponse.json({ success: false, message: "Invalid inventory range" }, { status: 400 })
    }

    // Connect to database
    console.log("[v0] Connecting to database for dealer enquiry...")
    await connectDB()
    console.log("[v0] Database connected")

    const dealerData = {
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: withCountryCode(phone),
      city: city.trim(),
      state: state.trim(),
      businessType,
      retailSpace: retailSpace.trim(),
      inventory,
      message: message?.trim() || "",
    }

    console.log("[v0] Creating dealer enquiry with data:", {
      ...dealerData,
      message: dealerData.message.substring(0, 50) + "...",
    })

    const dealerEnquiry = await DealerEnquiry.create(dealerData)

    console.log("[v0] Dealer enquiry saved successfully:", {
      id: dealerEnquiry._id,
      businessName: dealerEnquiry.businessName,
      email: dealerEnquiry.email,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Your application submitted and under review. Team will contact you in 2-3 working days",
        enquiryId: dealerEnquiry._id,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[DEALER_ENQUIRY_ERROR]", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit dealer enquiry. Please try again." },
      { status: 500 },
    )
  }
}
