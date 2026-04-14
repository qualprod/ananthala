"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Heart, Package, Lock, UserIcon, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

interface AuthenticatedUser {
  id: string
  fullname: string
  email: string
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Orders",
    href: "/customer/orders",
    icon: Package,
  },
 
  {
    label: "Cart",
    href: "/customer/cart",
    icon: ShoppingCart,
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: UserIcon,
  },
  {
    label: "Change Password",
    href: "/customer/change-password",
    icon: Lock,
  },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify")
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          setIsLoading(false)
        } else {
          setIsLoading(false)
          router.push("/login?redirect=/customer/dashboard")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsLoading(false)
        router.push("/login?redirect=/customer/dashboard")
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getFirstName = (fullname: string) => {
    return fullname.split(" ")[0]
  }

  const getGradientColor = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase()
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-green-500",
    ]
    const index = firstLetter.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED]">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: "#D9CFC7" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 relative">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-foreground hover:bg-[#EED9C4]/60"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center overflow-hidden"
              aria-label="Ananthala home"
            >
              <Image src="/logo.png" alt="Ananthala" width={170} height={68} className="h-24 w-auto " />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-[#EED9C4]/60 transition-colors relative"
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradientColor(user.fullname)} flex items-center justify-center text-white font-semibold cursor-pointer`}
                  >
                    {getFirstName(user.fullname).charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-foreground">
                  <div className="font-semibold">{getFirstName(user.fullname)}</div>
                  <div className="text-xs text-foreground/70 truncate">{user.email}</div>
                </div>
                <DropdownMenuItem asChild className="text-foreground cursor-pointer">
                  <Link href="/customer/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-foreground cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside
          className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-5rem)] sticky top-20"
          style={{ borderColor: "#D9CFC7" }}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-[#EED9C4] text-foreground"
                      : "text-foreground hover:bg-[#EED9C4]/60"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {isSidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            <aside
              className="fixed left-0 top-20 bottom-0 w-64 bg-white border-r z-50 lg:hidden animate-in slide-in-from-left duration-300"
              style={{ borderColor: "#D9CFC7" }}
            >
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-[#EED9C4] text-foreground"
                          : "text-foreground hover:bg-[#EED9C4]/60"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
