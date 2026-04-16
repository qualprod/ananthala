import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import PendingUser from "@/models/PendingUser"
import nodemailer from "nodemailer"
import { validatePassword } from "@/lib/password-validation"
import { withCountryCode } from "@/lib/phone"

export const runtime = "nodejs"

// Helper function to generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Helper function to send verification email
async function sendVerificationEmail(email: string, otp: string, fullname: string) {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || "gmail"
    let transporter

    if (emailProvider === "gmail") {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        throw new Error("Gmail credentials not configured.")
      }
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      })
    } else if (emailProvider === "smtp") {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        throw new Error("SMTP credentials not configured.")
      }
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      })
    } else {
      throw new Error(`Unsupported email provider: ${emailProvider}`)
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - Ananthala",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; background-color: #F5F1ED;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #8B5A3C; font-size: 28px; margin: 0; letter-spacing: 2px;">ANANTHALA</h1>
              <p style="color: #6D4530; font-size: 14px; margin-top: 8px;">Email Verification</p>
            </div>
            
            <p style="color: #6D4530; font-size: 16px; margin-bottom: 16px;">Hello ${fullname},</p>
            <p style="color: #8B5A3C; font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
              Thank you for registering with Ananthala. Please use the OTP below to verify your email address and complete your registration.
            </p>
            
            <div style="background-color: #F5F1ED; border: 2px solid #8B5A3C; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #6D4530; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Verification OTP</p>
              <h2 style="color: #8B5A3C; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h2>
            </div>
            
            <p style="color: #B8A396; font-size: 13px; text-align: center; margin-top: 24px;">
              This OTP will expire in <strong style="color: #8B5A3C;">10 minutes</strong>.
            </p>
            <p style="color: #B8A396; font-size: 12px; text-align: center; margin-top: 16px;">
              If you didn&apos;t request this verification, please ignore this email.
            </p>
            
            <div style="border-top: 1px solid #E5D5C5; margin-top: 32px; padding-top: 20px; text-align: center;">
              <p style="color: #B8A396; font-size: 11px; margin: 0;">
                © 2026 Ananthala. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("[EMAIL_ERROR]", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] Signup request received")
    const { fullname, email, password, phone } = await request.json()

    // Validate input - both email and phone are mandatory
    if (!fullname || !email || !password || !phone) {
      return NextResponse.json({ success: false, message: "All fields are required (name, email, password, and phone)" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        message: passwordValidation.errors[0] || "Password does not meet requirements" 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    // Validate phone
    const rawPhone = String(phone).trim()
    let phoneDigits = rawPhone.replace(/\D/g, "")
    
    if (!/^\d{6,15}$/.test(phoneDigits)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid phone number with country code" },
        { status: 400 },
      )
    }

    // Normalize phone with country code for consistent storage
    const normalizedPhone = withCountryCode(phone).replace(/^\+/, "")
    const normalizedEmail = email.toLowerCase()

    // Connect to database
    console.log("[v0] Connecting to database...")
    await connectDB()
    console.log("[v0] Database connected")

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return NextResponse.json({ success: false, message: "An account already exists with this email" }, { status: 409 })
    }

    // Check for existing phone
    const existingPhoneUser = await User.findOne({ phone: normalizedPhone })
    if (existingPhoneUser) {
      return NextResponse.json(
        { success: false, message: "An account already exists with this phone number" },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate OTP for email verification only
    const emailOtp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Check if there's already a pending registration
    let pendingUser = await PendingUser.findOne({ 
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone }
      ]
    })

    if (pendingUser) {
      // Update existing pending registration
      pendingUser.fullname = fullname
      pendingUser.email = normalizedEmail
      pendingUser.password = hashedPassword
      pendingUser.phone = normalizedPhone
      pendingUser.emailOtp = emailOtp
      pendingUser.emailOtpExpiry = otpExpiry
      pendingUser.isEmailVerified = false
      pendingUser.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await pendingUser.save()
    } else {
      // Create new pending registration
      pendingUser = await PendingUser.create({
        fullname,
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        emailOtp,
        emailOtpExpiry: otpExpiry,
        isEmailVerified: false,
      })
    }

    console.log("[v0] Pending user created/updated:", { email: normalizedEmail, phone: normalizedPhone })

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, emailOtp, fullname)
      console.log("[v0] Verification email sent to:", normalizedEmail)
    } catch (emailError: any) {
      console.error("[v0] Failed to send verification email:", emailError)
      return NextResponse.json(
        { success: false, message: "Failed to send verification email. Please try again." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent. Please verify your email to complete registration.",
        requiresVerification: true,
        email: normalizedEmail,
        maskedEmail: normalizedEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[SIGNUP_ERROR]", error)
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
