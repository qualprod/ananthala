"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Award, LockIcon, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear session storage when window closes
      sessionStorage.removeItem("admin_session")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/admin/admin-verify")
        const data = await response.json()
        if (data.authenticated) {
          router.push("/admin/dashboard")
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/admin/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem("admin_session", "active")

        toast({
          title: "Success",
          description: "Login successful as admin",
        })

        setTimeout(() => {
          window.location.href = "/admin/dashboard"
        }, 500)
      } else {
        toast({
          title: "Access Denied",
          description: data.message || "Invalid admin credentials.",
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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1ED] via-[#EDE6DD] to-[#F5F1ED] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white border border-[#E5D5C5] rounded-lg text-foreground hover:text-foreground transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ananthala</span>
        </Link>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #8B5A3C 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Column - Content Section */}
        <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Logo/Icon */}
          <div className="flex justify-center lg:justify-start">
            <img
              src="/logo.png"
              alt="Ananthala Admin"
              className="h-24 md:h-28 w-auto mix-blend-darken"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-foreground tracking-wide leading-tight">
              Welcome to Admin Portal
            </h1>
            <p className="text-2xl md:text-3xl text-foreground font-light tracking-wider">
              of <span className="font-normal text-foreground">Ananthala</span>
            </p>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-foreground/70 to-transparent mx-auto lg:mx-0" />
          </div>

          {/* Quote Section */}
          <blockquote className="space-y-4 py-6">
            <p className="text-lg md:text-xl text-foreground italic leading-relaxed">
              "Excellence in administration is the foundation of exceptional service. Manage with precision, deliver
              with care."
            </p>
            <div className="h-px w-32 bg-[#E5D5C5] mx-auto lg:mx-0" />
          </blockquote>

          {/* Features List */}
          <div className="space-y-5 pt-0 -mt-2">
            <div className="flex items-start gap-4 justify-center lg:justify-start">
              <div className="w-12 h-12 rounded-full bg-white shadow-md border border-[#E5D5C5] flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-[#8B5A3C]" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-2xl font-medium text-foreground mb-1">Complete Control</h3>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  Manage orders, products, and customers with ease
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 justify-center lg:justify-start">
              <div className="w-12 h-12 rounded-full bg-white shadow-md border border-[#E5D5C5] flex items-center justify-center flex-shrink-0">
                <LockIcon className="w-6 h-6 text-[#8B5A3C]" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-2xl font-medium text-foreground mb-1">Secure Access</h3>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  Enterprise-grade security for your business data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 justify-center lg:justify-start">
              <div className="w-12 h-12 rounded-full bg-white shadow-md border border-[#E5D5C5] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#8B5A3C]" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-2xl font-medium text-foreground mb-1">Real-time Analytics</h3>
                <p className="text-lg text-foreground/70 leading-relaxed">Track performance and insights instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form Section */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5D5C5] p-8 md:p-10">
            <h2 className="text-2xl font-medium text-foreground mb-8 text-center tracking-wide">Admin Login</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Address Field */}
              <div>
                <label htmlFor="admin-email" className="block text-foreground text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5A3C]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    placeholder=""
                    className="pl-12 h-12 bg-white border-[#D9CFC7] text-foreground placeholder:text-foreground/70 focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3 rounded-lg"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="admin-password" className="block text-foreground text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5A3C]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=""
                    className="pl-12 pr-12 h-12 bg-white border-[#D9CFC7] text-foreground placeholder:text-foreground/70 focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3 rounded-lg"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-medium text-base transition-all duration-200 rounded-lg shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Access Admin Portal"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E5D5C5]">
              <p className="text-sm text-foreground/70 text-center leading-relaxed font-semibold">
                This is a secure area. Unauthorized access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
