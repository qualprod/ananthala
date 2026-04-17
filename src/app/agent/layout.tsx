"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus_Jakarta_Sans } from "next/font/google"
import { LayoutDashboard, Tag, Settings, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const googleSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-google-sans",
})

interface AuthenticatedAgent {
  id: string
  fullname: string
  email: string
  role: string
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/agent/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Offer-Coupons",
    href: "/agent/coupons",
    icon: Tag,
  },
  {
    label: "Settings",
    href: "/agent/settings",
    icon: Settings,
  },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [agent, setAgent] = useState<AuthenticatedAgent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/agent/agent-verify", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.authenticated && data.user && data.user.role === "agent") {
          setAgent(data.user)
        } else {
          sessionStorage.removeItem("agent_session")
          router.push("/agent")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        sessionStorage.removeItem("agent_session")
        router.push("/agent")
      } finally {
        setIsLoading(false)
      }
    }

    if (pathname !== "/agent") {
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("agent_session")
      await fetch("/api/auth/agent/agent-logout", {
        method: "POST",
        credentials: "include",
      })
      setAgent(null)
      router.push("/agent")
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

  if (isLoading && pathname !== "/agent") {
    return (
      <div className={`min-h-screen bg-[#F5F1ED] flex items-center justify-center ${googleSans.variable}`}>
        <style jsx global>{`
          .agent-loading * {
            font-family: var(--font-google-sans) !important;
          }
        `}</style>
        <div className="text-center agent-loading">
          <div className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-[#E5D5C5] flex items-center justify-center mx-auto mb-4 animate-pulse p-2">
            <img src="/logo.png" alt="Ananthala" className="w-full h-full object-contain" />
          </div>
          <p className="text-[#8B5A3C] font-medium">Verifying agent access...</p>
        </div>
      </div>
    )
  }

  if (!agent || pathname === "/agent") {
    return children
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED]">
      <style jsx global>{`
        .agent-portal * {
          font-family: var(--font-google-sans) !important;
        }
      `}</style>
      <div className={`agent-portal ${googleSans.variable}`}>
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: "#D9CFC7" }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-[#8B5A3C] hover:bg-[#8B5A3C]/10"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Ananthala" className="h-8 w-auto" />
                  <div>
                    <Link
                      href="/agent/dashboard"
                      className="text-[#8B5A3C] text-lg font-normal tracking-wider hover:text-[#6D4530] transition-colors"
                    >
                      ANANTHALA
                    </Link>
                    <p className="text-xs text-[#B8A396]">Agent Portal</p>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#8B5A3C] hover:bg-[#8B5A3C]/10 transition-colors relative"
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradientColor(agent.fullname)} flex items-center justify-center text-white font-semibold cursor-pointer`}
                    >
                      {getFirstName(agent.fullname).charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm text-[#6D4530]">
                    <div className="font-semibold">{getFirstName(agent.fullname)}</div>
                    <div className="text-xs text-[#8B5A3C]/70 truncate">{agent.email}</div>
                  </div>
                  <DropdownMenuItem asChild className="text-[#6D4530] cursor-pointer">
                    <Link href="/agent/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-[#6D4530] cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside
            className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-4rem)] sticky top-16"
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
                      isActive ? "bg-[#8B5A3C] text-white" : "text-[#6D4530] hover:bg-[#8B5A3C]/10 hover:text-[#8B5A3C]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <>
              <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
              <aside
                className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r z-50 lg:hidden animate-in slide-in-from-left duration-300"
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
                            ? "bg-[#8B5A3C] text-white"
                            : "text-[#6D4530] hover:bg-[#8B5A3C]/10 hover:text-[#8B5A3C]"
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

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
