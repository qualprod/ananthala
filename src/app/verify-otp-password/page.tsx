"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

function VerifyOTPForm() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "Invalid access. Please start from forgot password page.",
        variant: "destructive",
      })
      router.push("/forgot-password")
    }
  }, [email, router, toast])

  // Timer for resend button
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (timeLeft === 0) {
      setCanResend(true)
    }
  }, [timeLeft, canResend])

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !otp || otp.length !== 4) {
      toast({
        title: "Error",
        description: "Please enter a valid 4-digit verification code.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-otp-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "OTP verified successfully. You can now reset your password.",
        })
        // Redirect to reset password page with email
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid OTP. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return

    setResendLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "A new OTP has been sent to your email.",
        })
        setTimeLeft(60)
        setCanResend(false)
        setOtp("")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend OTP. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="Ananthala"
              className="h-16 md:h-20 w-auto mx-auto mix-blend-lighten"
            />
          </Link>
        </div>

        {/* Verify OTP Card */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
          {/* Back Link */}
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-[#8B5A3C] hover:text-[#6D4530] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-[#6D4530] mb-2">Verify Code</h1>
            <p className="text-[#B8A396] text-sm">Enter the 4-digit verification code sent to your email address.</p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-[#6D4530] text-base font-medium mb-3">
                Verification Code
              </label>
              <div className="flex justify-center">
                <InputOTP maxLength={4} value={otp} onChange={setOtp} disabled={isLoading}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-12 border-[#E5D5C5] text-[#6D4530] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-[#B8A396] text-center mt-3">Enter the 4-digit code from your email</p>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || otp.length !== 4}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            {canResend ? (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-[#8B5A3C] hover:text-[#6D4530] font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            ) : (
              <p className="text-[#B8A396] text-sm">
                Resend OTP in <span className="font-semibold text-[#6D4530]">{timeLeft}s</span>
              </p>
            )}
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#B8A396]">
              Remember your password?{" "}
              <Link href="/login" className="text-[#8B5A3C] hover:text-[#6D4530] font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center">
          <div className="text-[#8B5A3C]">Loading...</div>
        </div>
      }
    >
      <VerifyOTPForm />
    </Suspense>
  )
}
