"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        // Email exists, redirect to reset password page with email
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      } else {
        toast({
          title: "Error",
          description: data.message || "Email not found. Please check and try again.",
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

  return (
    <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="Ananthala"
              className="h-16 md:h-20 w-auto mx-auto mix-blend-multiply"
            />
          </Link>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
          {/* Back to Login Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#8B5A3C] hover:text-[#6D4530] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-[#6D4530] mb-2">Forgot Password?</h1>
            <p className="text-[#B8A396] text-sm">Enter your email address to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address Field */}
            <div>
              <label htmlFor="email" className="block text-[#6D4530] text-base font-medium mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5A3C]">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white border-[#E5D5C5] text-[#6D4530] placeholder:text-[#B8A396] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-medium text-base transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Change Password"}
            </Button>
          </form>

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
