import { useEffect, useRef, useCallback } from "react"
import { useCart } from "@/contexts/cart-context"
import type { CartItem } from "@/components/cart/cart-drawer"

const CART_STORAGE_KEY = "ananthala_cart"

interface UseCartSyncOptions {
  userId?: string
  enabled?: boolean
  pollIntervalMs?: number
  onSyncUpdate?: (items: CartItem[]) => void
}

/**
 * Syncs cart from server without calling addToCart (which shows a toast per item).
 */
export function useCartSync(options: UseCartSyncOptions) {
  const { applyRemoteCart, flushCartToServer, cartItems } = useCart()
  const cartRef = useRef(cartItems)
  cartRef.current = cartItems

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncVersionRef = useRef<number>(0)
  const isSyncingRef = useRef<boolean>(false)

  const {
    userId,
    enabled = true,
    pollIntervalMs = 5000,
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
        // 401 = no/expired session cookie — normal if logged out or token expired; don't spam the console.
        if (response.status !== 401) {
          console.error("[v0] Cart sync failed:", response.status, response.statusText)
        }
        return
      }

      const data = await response.json()

      if (data.success && data.hasSyncedChanges && data.cart) {
        const serverItems = data.cart.items || []

        // If the client explicitly cleared the cart ([]) but the server still has rows (race before POST), flush empty to server — do not resurrect stale lines or spam toasts.
        try {
          const raw =
            typeof window !== "undefined" ? window.localStorage.getItem(CART_STORAGE_KEY) : null
          if (raw !== null) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length === 0 && serverItems.length > 0) {
              await fetch("/api/cart/save", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: window.localStorage.getItem("user_email"),
                  userId: window.localStorage.getItem("user_id"),
                  userFullname: window.localStorage.getItem("user_fullname"),
                  items: [],
                  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                }),
              })
              lastSyncVersionRef.current = data.lastSyncVersion || data.cart.cartVersion
              return
            }
          }
        } catch {
          /* ignore */
        }

        const localItems = cartRef.current
        // Server still empty while local has lines — debounced save often has not landed yet. Push client cart; never wipe.
        if (serverItems.length === 0 && localItems.length > 0) {
          await flushCartToServer()
          lastSyncVersionRef.current = data.lastSyncVersion || data.cart.cartVersion
          return
        }

        // DB snapshot has fewer cart lines than the client (new adds not saved yet). Push full client cart — do not replace with a partial server list.
        if (serverItems.length > 0 && localItems.length > serverItems.length) {
          await flushCartToServer()
          lastSyncVersionRef.current = data.lastSyncVersion || data.cart.cartVersion
          return
        }

        applyRemoteCart(serverItems)

        lastSyncVersionRef.current = data.lastSyncVersion || data.cart.cartVersion

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
  }, [enabled, userId, applyRemoteCart, flushCartToServer, onSyncUpdate])

  useEffect(() => {
    if (!enabled || !userId) return

    syncCartFromServer()

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
