import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PasswordLoginFormProps {
  isLoading?: boolean
}

export function PasswordLoginForm({ isLoading: initialLoading = false }: PasswordLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(initialLoading)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [redirectUrl, setRedirectUrl] = useState<string>("/")

  // Get redirect URL from query parameter
  useEffect(() => {
    const redirect = searchParams.get("redirect")
    if (redirect) {
      setRedirectUrl(redirect)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Login successful! ...",
        })
        setTimeout(() => {
          router.push(redirectUrl)
          router.refresh()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: data.message || "Login failed. Please try again.",
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
    <form onSubmit={handleSubmit} className="space-y-6 font-roboto">
      <div>
        <label htmlFor="email" className="block text-[#6D4530] text-sm md:text-base font-semibold mb-3">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B5A3C]" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder=""
            className="pl-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-[#6D4530] text-sm md:text-base font-semibold mb-3 ">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B5A3C]" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder=""
            className="pl-12 pr-12 h-12 bg-white border-[#D9CFC7] text-[#000000] placeholder:text-[#000000] focus:border-[#8B5A3C] focus:ring-[#8B5A3C] text-base font-semibold mb-3"
            required
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
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-[#B8A396] data-[state=checked]:bg-[#8B5A3C]"
            disabled={isLoading}
          />
          <label htmlFor="remember" className="text-xs md:text-sm text-[#6D4530] cursor-pointer select-none">
            Remember me
          </label>
        </div>

        <Link
          href="/forgot-password"
          className="text-xs md:text-sm text-[#8B5A3C] hover:text-[#6D4530] font-medium transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-[#8B5A3C] hover:bg-[#6D4530] text-white font-semibold text-base transition-colors"
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  )
}
