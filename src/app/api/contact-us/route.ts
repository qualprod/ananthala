import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ContactUs from "@/models/ContactUs"
import { withCountryCode } from "@/lib/phone"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("[v0] Contact form submission received")
    const { name, email, phone, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email, subject, and message are required" },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // Connect to database
    console.log("[v0] Connecting to database for contact form...")
    await connectDB()
    console.log("[v0] Database connected")

    const contactData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() ? withCountryCode(phone) : "",
      subject: subject.trim(),
      message: message.trim(),
    }

    console.log("[v0] Creating contact form entry with data:", {
      ...contactData,
      message: contactData.message.substring(0, 50) + "...",
    })

    const contact = await ContactUs.create(contactData)

    console.log("[v0] Contact form saved successfully:", {
      id: contact._id,
      email: contact.email,
      subject: contact.subject,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully. Ananthala team will contact soon",
        contactId: contact._id,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[CONTACT_FORM_ERROR]", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit contact form. Please try again." },
      { status: 500 },
    )
  }
}
