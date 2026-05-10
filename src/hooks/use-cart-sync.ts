import { useEffect, useRef, useCallback } from "react"
import { useCart } from "@/contexts/cart-context"
import type { CartItem } from "@/components/cart/cart-drawer"

interface UseCartSyncOptions {
  userId?: string
  enabled?: boolean
  pollIntervalMs?: number
  onSyncUpdate?: (items: CartItem[]) => void
}

/**
 * Hook to sync cart in real-time across browsers
 * Polls the server for cart updates and syncs local state
 */
export function useCartSync(options: UseCartSyncOptions) {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart()
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncVersionRef = useRef<number>(0)
  const isSyncingRef = useRef<boolean>(false)

  const {
    userId,
    enabled = true,
    pollIntervalMs = 5000, // Poll every 5 seconds
    onSyncUpdate,
  } = options

  const syncCartFromServer = useCallback(async () => {
    if (!enabled || !userId || isSyncingRef.current) {
      return
    }

    isSyncingRef.current = true

    try {
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          lastSyncVersion: lastSyncVersionRef.current,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Cart sync failed:", response.statusText)
        isSyncingRef.current = false
        return
      }

      const data = await response.json()

      if (data.success && data.hasSyncedChanges && data.cart) {
        // Update the local cart with server state
        const serverItems = data.cart.items || []
        const localItemIds = new Set(cartItems.map((item) => item.id))
        const serverItemIds = new Set(serverItems.map((item: any) => item.id))

        // Find items to remove (exist locally but not on server)
        localItemIds.forEach((id) => {
          if (!serverItemIds.has(id)) {
            removeFromCart(id)
          }
        })

        // Find items to add or update
        serverItems.forEach((serverItem: any) => {
          const localItem = cartItems.find((item) => item.id === serverItem.id)

          if (!localItem) {
            // Item doesn't exist locally, add it
            addToCart({
              id: serverItem.id,
              name: serverItem.name,
              image: serverItem.image,
              price: serverItem.price,
              quantity: serverItem.quantity,
              size: serverItem.size,
              fabric: serverItem.fabric,
              productColor: serverItem.productColor,
              productColorHex: serverItem.productColorHex,
            })
          } else if (localItem.quantity !== serverItem.quantity) {
            // Quantity differs, update it
            updateQuantity(serverItem.id, serverItem.quantity)
          }
        })

        // Update sync version
        lastSyncVersionRef.current = data.lastSyncVersion || data.cart.cartVersion

        // Notify parent component of sync
        if (onSyncUpdate) {
          onSyncUpdate(serverItems)
        }

        console.log("[v0] Cart synced from server, version:", lastSyncVersionRef.current)
      }
    } catch (error) {
      console.error("[v0] Error syncing cart from server:", error)
    } finally {
      isSyncingRef.current = false
    }
  }, [enabled, userId, cartItems, addToCart, removeFromCart, updateQuantity, onSyncUpdate])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !userId) return

    // Initial sync
    syncCartFromServer()

    // Set up polling
    pollTimerRef.current = setInterval(() => {
      syncCartFromServer()
    }, pollIntervalMs)

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [enabled, userId, pollIntervalMs, syncCartFromServer])

  return {
    syncCartFromServer,
    lastSyncVersion: lastSyncVersionRef.current,
  }
}
