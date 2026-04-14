"use client"

import type React from "react"

import { useState } from "react"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Message state
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Validation helpers
  const isPasswordValid = newPassword.length >= 6
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const isFormValid = currentPassword && newPassword && confirmPassword && isPasswordValid && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!isFormValid) {
      setErrorMessage("Please fill all fields correctly.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(data.message)
        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      } else {
        setErrorMessage(data.message || "Failed to update password.")
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.")
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F4] to-[#F5F1ED] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2">Settings</h1>
          <p className="text-foreground/70">Manage your admin account security</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-[#D9CFC7] shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#8B5A3C]/10 to-[#D9CFC7]/20 px-6 sm:px-8 py-6 border-b border-[#D9CFC7]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B5A3C] flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Security</h2>
                <p className="text-sm text-foreground/70">Update your password to keep your account secure</p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-6 sm:px-8 py-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">{successMessage}</p>
                  <p className="text-xs text-green-700 mt-1">Redirecting to login...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password Field */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-semibold text-foreground">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10 border-[#D9CFC7] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-foreground placeholder:text-foreground/50"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-foreground">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password (minimum 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 border-[#D9CFC7] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-foreground placeholder:text-foreground/50"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPassword && !isPasswordValid && (
                  <p className="text-xs text-red-600 mt-1">Password must be at least 6 characters long</p>
                )}
                {newPassword && isPasswordValid && <p className="text-xs text-green-600 mt-1">Password is strong</p>}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 border-[#D9CFC7] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-foreground placeholder:text-foreground/50"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
                {confirmPassword && passwordsMatch && <p className="text-xs text-green-600 mt-1">Passwords match</p>}
              </div>

              {/* Password Requirements Info */}
              <div className="bg-[#F5F1ED] rounded-lg p-4 border border-[#D9CFC7]">
                <p className="text-xs font-semibold text-foreground mb-2">Password Requirements:</p>
                <ul className="text-xs text-foreground/80 space-y-1">
                  <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? "text-green-600" : ""}`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? "bg-green-600" : "bg-[#D9CFC7]"}`}
                    ></span>
                    At least 6 characters
                  </li>
                  <li className={`flex items-center gap-2 ${passwordsMatch && newPassword ? "text-green-600" : ""}`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${passwordsMatch && newPassword ? "bg-green-600" : "bg-[#D9CFC7]"}`}
                    ></span>
                    New and confirm passwords match
                  </li>
                  <li
                    className={`flex items-center gap-2 ${currentPassword && newPassword !== currentPassword ? "text-green-600" : ""}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${currentPassword && newPassword !== currentPassword ? "bg-green-600" : "bg-[#D9CFC7]"}`}
                    ></span>
                    Different from current password
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className="flex-1 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-semibold py-2 h-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmPassword("")
                    setErrorMessage("")
                    setSuccessMessage("")
                  }}
                  disabled={isLoading}
                  className="px-6 border-[#D9CFC7] text-foreground hover:bg-[#F5F1ED]"
                >
                  Clear
                </Button>
              </div>
            </form>

            {/* Security Note */}
            <div className="mt-8 pt-6 border-t border-[#D9CFC7]">
              <p className="text-xs text-foreground/70 leading-relaxed">
                <span className="font-semibold text-foreground">🔒 Security Note:</span> Your password is securely hashed
                and stored. After updating your password, you'll be logged out for security reasons and will need to
                login again with your new password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
