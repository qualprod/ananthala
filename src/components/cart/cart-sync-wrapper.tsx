"use client"

import React, { useEffect, useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { useCartSync } from "@/hooks/use-cart-sync"

/**
 * Wrapper component that enables real-time cart synchronization
 * across browsers and devices for logged-in users
 */
export function CartSyncWrapper({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [isEnabled, setIsEnabled] = useState(false)
  const { cartItems } = useCart()

  // Check if user is logged in and get userId
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.id) {
            setUserId(data.user.id)
            setIsEnabled(true)
          }
        }
      } catch (error) {
        console.error("[v0] Error checking user auth for cart sync:", error)
      }
    }

    checkUserAuth()
  }, [])

  // Use the cart sync hook for real-time synchronization
  useCartSync({
    userId,
    enabled: isEnabled,
    pollIntervalMs: 5000, // Sync every 5 seconds
    onSyncUpdate: (items) => {
      console.log("[v0] Cart synced across browsers, items:", items.length)
    },
  })

  return <>{children}</>
}
