import { useEffect, useRef, useCallback } from "react"
import { useCart } from "@/contexts/cart-context"
import type { CartItem } from "@/components/cart/cart-drawer"

interface CartPersistenceOptions {
  userId?: string
  userEmail?: string
  userName?: string
  userPhone?: string
  enabled?: boolean
  debounceMs?: number
}

/**
 * Hook to persist cart data to database with debouncing
 * Saves cart items with product colors and user information
 */
export function useCartPersistence(options: CartPersistenceOptions) {
  const { cartItems } = useCart()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>("")
  const {
    userId,
    userEmail,
    userName,
    userPhone,
    enabled = true,
    debounceMs = 3000, // Auto-save every 3 seconds of inactivity
  } = options

  const saveCartToDatabase = useCallback(async () => {
    if (!enabled || cartItems.length === 0) {
      return
    }

    try {
      // Calculate totals
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const shipping = 0
      const total = subtotal + shipping

      // Create payload
      const cartData = {
        items: cartItems.map((item: CartItem) => ({
          productName: item.name,
          productImage: item.image,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          fabric: item.fabric,
          productColor: item.productColor,
          productColorHex: item.productColorHex,
        })),
        userId,
        userEmail,
        userName,
        userPhone,
        subtotal,
        shipping,
        total,
      }

      // Prevent duplicate saves
      const currentData = JSON.stringify(cartData)
      if (currentData === lastSavedRef.current) {
        return
      }

      lastSavedRef.current = currentData

      const response = await fetch("/api/cart/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      })

      if (!response.ok) {
        console.error("Failed to save cart to database")
        return
      }

      const result = await response.json()
      console.log("[v0] Cart saved to database with ID:", result.cartId)
    } catch (error) {
      console.error("[v0] Error saving cart to database:", error)
    }
  }, [cartItems, enabled, userId, userEmail, userName, userPhone])

  // Debounced save on cart changes
  useEffect(() => {
    if (!enabled) return

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      saveCartToDatabase()
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [cartItems, enabled, debounceMs, saveCartToDatabase])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled && cartItems.length > 0) {
        saveCartToDatabase()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [cartItems, enabled, saveCartToDatabase])

  return {
    saveCartNow: saveCartToDatabase,
    isSaving: debounceTimerRef.current !== null,
  }
}
