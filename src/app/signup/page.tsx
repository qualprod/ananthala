"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Eye, EyeOff, Phone, CheckCircle2, ArrowLeft, RefreshCw, XCircle, Check } from "lucide-react"
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

type Step = "form" | "verify"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<Step>("form")
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
  })
  const [password, setPassword] = useState("")
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(""))
  
  // Verification state
  const [emailOtp, setEmailOtp] = useState(["", "", "", ""])
  const [resendTimer, setResendTimer] = useState(0)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const router = useRouter()
  const { toast } = useToast()

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Password validation handler
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordValidation(validatePassword(newPassword))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate password before submission
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    const formDataObj = new FormData(e.currentTarget)
    const fullname = formDataObj.get("fullname") as string
    const email = formDataObj.get("email") as string
    const passwordValue = password
    const phone = formDataObj.get("phone") as string

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullname, email, password: passwordValue, phone }),
      })

      const data = await response.json()

      if (data.success && data.requiresVerification) {
        setFormData({ fullname, email, password: passwordValue, phone })
        setStep("verify")
        setResendTimer(60) // 60 seconds before allowing resend
        toast({
          title: "Verification Required",
          description: "Please check your email for the OTP code.",
        })
      } else if (data.success) {
        toast({
          title: "Success",
          description: "Signup successful! Redirecting to login...",
        })
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      } else {
        toast({
          title: "Error",
          description: data.message || "Signup failed. Please try again.",
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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...emailOtp]
    newOtp[index] = value.slice(-1)
    setEmailOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      emailOtpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && index > 0) {
      if (!emailOtp[index]) {
        emailOtpRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (pastedData.length === 4) {
      const newOtp = pastedData.split("")
      setEmailOtp(newOtp)
    }
  }

  const verifyEmailOtp = async () => {
    const otp = emailOtp.join("")
    if (otp.length !== 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 4-digit OTP",
        variant: "destructive",
      })
      return
    }

    setVerifyingEmail(true)
    try {
      const response = await fetch("/api/auth/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          emailOtp: otp,
        }),
      })

      const data = await response.json()

      if (data.success && data.accountCreated) {
        toast({
          title: "Account Created!",
          description: "Welcome to Ananthala! Redirecting to login...",
        })
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else if (data.success) {
        toast({
          title: "Verified",
          description: data.message,
        })
      } else {
        toast({
          title: "Verification Failed",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifyingEmail(false)
    }
  }

  const resendOtp = async () => {
    setResendingEmail(true)

    try {
      const response = await fetch("/api/auth/resend-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          type: "email",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResendTimer(60)
        toast({
          title: "OTP Sent",
          description: data.message,
        })
        // Clear the OTP inputs
        setEmailOtp(["", "", "", ""])
        emailOtpRefs.current[0]?.focus()
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResendingEmail(false)
    }
  }

  // Verification Step UI
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-[#8B5A3C] text-2xl font-normal tracking-wider">ANANTHALA</span>
            </Link>
          </div>

          {/* Verification Card */}
          <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-2 text-[#8B5A3C] hover:text-[#6D4530] mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to form</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#F5F1ED] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-[#8B5A3C]" />
              </div>
              <h2 className="text-xl font-semibold text-[#6D4530] mb-2">Verify Your Email</h2>
              <p className="text-[#8B5A3C] text-sm">
                We have sent a 4-digit OTP to your email address
              </p>
              <p className="text-[#6D4530] font-medium text-sm mt-1">
                {formData.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
              </p>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-[#6D4530] text-sm font-medium mb-3 text-center">
                Enter OTP
              </label>
              <div className="flex gap-3 justify-center">
                {emailOtp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { emailOtpRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className="w-14 h-14 text-center text-xl font-semibold border-2 border-[#E5D5C5] rounded-lg focus:border-[#8B5A3C] focus:outline-none text-[#6D4530] transition-colors"
                    disabled={verifyingEmail}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              onClick={verifyEmailOtp}
              disabled={verifyingEmail || emailOtp.join("").length !== 4}
              className="w-full h-12 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-medium text-base transition-colors mb-4"
            >
              {verifyingEmail ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify & Create Account"
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-[#8B5A3C] text-sm mb-2">
                {"Didn't receive the code?"}
              </p>
              <button
                onClick={resendOtp}
                disabled={resendTimer > 0 || resendingEmail}
                className="text-[#6D4530] hover:text-[#8B5A3C] font-medium text-sm disabled:text-[#B8A396] flex items-center gap-1 mx-auto transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${resendingEmail ? "animate-spin" : ""}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-6 pt-4 border-t border-[#E5D5C5]">
              <p className="text-xs text-[#B8A396] text-center">
                The OTP is valid for 10 minutes. Please check your spam folder if you don&apos;t see the email in your inbox.
              </p>
            </div>
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-[#6D4530]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#8B5A3C] hover:text-[#6D4530] font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Registration Form UI
  return (
    <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="Ananthala"
              className="h-24 md:h-28 w-auto mx-auto mix-blend-multiply"
            />
          </Link>
        </div>

        {/* Signup Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#6D4530] mb-2">Create Your Account</h1>
            <p className="text-sm text-[#8B5A3C]">Email verification required to complete signup</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullname" className="block text-[#6D4530] text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5A3C]">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="John Doe"
                  className="pl-12 h-12 bg-white border-[#E5D5C5] text-[#6D4530] placeholder:text-[#B8A396] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div>
              <label htmlFor="email" className="block text-[#6D4530] text-sm font-medium mb-2">
                Email Address <span className="text-red-500">*</span>
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
                  className="pl-12 h-12 bg-white border-[#E5D5C5] text-[#6D4530] placeholder:text-[#B8A396] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-[#B8A396] mt-1">A verification OTP will be sent to this email</p>
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="phone" className="block text-[#6D4530] text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5A3C]">
                  <Phone className="h-5 w-5" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  className="pl-12 h-12 bg-white border-[#E5D5C5] text-[#6D4530] placeholder:text-[#B8A396] focus:border-[#8B5A3C] focus:ring-[#8B5A3C]"
                  required
                  inputMode="numeric"
                  pattern="^(?:\+91[\s-]?)?[6-9]\d{9}$"
                  title="Enter a valid 10-digit Indian mobile number"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-[#6D4530] text-sm font-medium mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5A3C]">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`pl-12 pr-12 h-12 bg-white border-[#E5D5C5] text-[#6D4530] placeholder:text-[#B8A396] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] ${
                    password && !passwordValidation.isValid ? "border-red-300" : ""
                  } ${password && passwordValidation.isValid ? "border-green-400" : ""}`}
                  required
                  minLength={PASSWORD_REQUIREMENTS.minLength}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8A396] hover:text-[#8B5A3C] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </button>
              </div>
              
              {/* Password Requirements */}
              {password && (
                <div className="mt-3 p-3 bg-[#F5F1ED] rounded-lg">
                  <p className="text-xs font-medium text-[#6D4530] mb-2">Password must contain:</p>
                  <ul className="space-y-1">
                    <li className={`flex items-center gap-2 text-xs ${password.length >= PASSWORD_REQUIREMENTS.minLength ? "text-green-600" : "text-[#B8A396]"}`}>
                      {password.length >= PASSWORD_REQUIREMENTS.minLength ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      At least {PASSWORD_REQUIREMENTS.minLength} characters
                    </li>
                    <li className={`flex items-center gap-2 text-xs ${PASSWORD_REQUIREMENTS.uppercase.test(password) ? "text-green-600" : "text-[#B8A396]"}`}>
                      {PASSWORD_REQUIREMENTS.uppercase.test(password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One uppercase letter (A-Z)
                    </li>
                    <li className={`flex items-center gap-2 text-xs ${PASSWORD_REQUIREMENTS.lowercase.test(password) ? "text-green-600" : "text-[#B8A396]"}`}>
                      {PASSWORD_REQUIREMENTS.lowercase.test(password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One lowercase letter (a-z)
                    </li>
                    <li className={`flex items-center gap-2 text-xs ${PASSWORD_REQUIREMENTS.number.test(password) ? "text-green-600" : "text-[#B8A396]"}`}>
                      {PASSWORD_REQUIREMENTS.number.test(password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One number (0-9)
                    </li>
                    <li className={`flex items-center gap-2 text-xs ${PASSWORD_REQUIREMENTS.special.test(password) ? "text-green-600" : "text-[#B8A396]"}`}>
                      {PASSWORD_REQUIREMENTS.special.test(password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One special character (!@#$%&_*)
                    </li>
                  </ul>
                  
                  {/* Password Strength Indicator */}
                  {passwordValidation.isValid && (
                    <div className="mt-2 pt-2 border-t border-[#E5D5C5]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6D4530]">Strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordValidation.strength === "strong" ? "text-green-600" :
                          passwordValidation.strength === "good" ? "text-blue-600" :
                          passwordValidation.strength === "fair" ? "text-yellow-600" : "text-red-500"
                        }`}>
                          {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            

            {/* Create Account Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-medium text-base transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending Verification...
                </span>
              ) : (
                "Continue to Verification"
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-[#6D4530]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#8B5A3C] hover:text-[#6D4530] font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
