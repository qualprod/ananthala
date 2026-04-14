"use client"
import { useState } from "react"
import Link from "next/link"
import { LoginFormsWrapper } from "@/components/auth/login-forms-wrapper"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "email-otp" | "phone-otp">("password")

  return (
    <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center px-4 py-12 md:py-8 font-roboto">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-4 md:mb-8">
          <Link href="/" className="inline-block transition-transform hover:scale-[1.01]">
            <img
              src="/logo.png"
              alt="Ananthala"
              className="h-24 md:h-28 w-auto mx-auto mix-blend-multiply"
            />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-10 border border-[#E5D5C5] font-roboto">
          <h1 className="text-2xl md:text-3xl font-serif text-[#6D4530] mb-8 text-center font-cormorant">Sign In</h1>

          <div className="flex gap-2 mb-8 bg-[#F5F1ED] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 py-2 px-3 rounded text-xs md:text-sm font-semibold transition-all ${
                activeTab === "password" ? "bg-[#8B5A3C] text-white shadow-md" : "text-[#6D4530] hover:bg-white"
              }`}
              type="button"
              aria-pressed={activeTab === "password"}
            >
              Password
            </button>
            <button
              onClick={() => setActiveTab("email-otp")}
              className={`flex-1 py-2 px-3 rounded text-xs md:text-sm font-semibold transition-all ${
                activeTab === "email-otp" ? "bg-[#8B5A3C] text-white shadow-md" : "text-[#6D4530] hover:bg-white"
              }`}
              type="button"
              aria-pressed={activeTab === "email-otp"}
            >
              Email OTP
            </button>
            <button
              onClick={() => setActiveTab("phone-otp")}
              className={`flex-1 py-2 px-3 rounded text-xs md:text-sm font-semibold transition-all ${
                activeTab === "phone-otp" ? "bg-[#8B5A3C] text-white shadow-md" : "text-[#6D4530] hover:bg-white"
              }`}
              type="button"
              aria-pressed={activeTab === "phone-otp"}
            >
              Phone OTP
            </button>
          </div>

          <LoginFormsWrapper activeTab={activeTab} />

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-[#6D4530] text-sm md:text-base">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#8B5A3C] hover:text-[#6D4530] font-semibold transition-colors">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center mt-6 text-[#8B5A3C] text-xs md:text-sm">
          By signing in, you agree to our{" "}
          <Link href="/policy-terms" className="underline hover:no-underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/policy-privacy" className="underline hover:no-underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
