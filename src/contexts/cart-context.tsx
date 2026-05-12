"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { type CartItem } from "@/components/cart/cart-drawer"
import { toast, useToast } from "@/hooks/use-toast"

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  /** Replace cart from server sync without showing add-to-cart toasts */
  applyRemoteCart: (items: unknown[]) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isLoading: boolean
  appliedCoupons: Array<{
    code: string
    discountAmount: number
    type: string
    discount: number
  }>
  setAppliedCoupon: (coupon: any) => void
  clearCoupon: (couponCode?: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "ananthala_cart"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { dismiss: dismissAllToasts } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [appliedCoupons, setAppliedCoupons] = useState<any[]>([])

  const normalizeItemName = (name: unknown) =>
    String(name ?? "")
      .replace(/\bGRACE\b/g, "Grace")
  const getCartItemMergeKey = (item: CartItem) =>
    [
      normalizeItemName(item.name).trim().toLowerCase(),
      (item.size || "").trim().toLowerCase(),
      (item.fabric || "").trim().toLowerCase(),
      String(item.price),
    ].join("|")

  const mergeDuplicateCartItems = (items: CartItem[]) => {
    const merged = new Map<string, CartItem>()

    items.forEach((item) => {
      const normalizedItem = { ...item, name: normalizeItemName(item.name ?? "") }
      const key = getCartItemMergeKey(normalizedItem)
      const existing = merged.get(key)

      if (existing) {
        existing.quantity += normalizedItem.quantity
        return
      }

      merged.set(key, { ...normalizedItem })
    })

    return Array.from(merged.values())
  }

  /** DB/localStorage may contain loose types; coerce so UI never shows "[object Object]". */
  const coerceCartItem = (raw: unknown): CartItem | null => {
    if (!raw || typeof raw !== "object") return null
    const item = raw as Record<string, unknown>
    const q = Number(item.quantity)
    const p = Number(item.price)
    const img =
      typeof item.image === "string" && item.image.trim()
        ? item.image
        : "/placeholder.svg"
    return {
      ...(item as unknown as CartItem),
      id: String(item.id ?? ""),
      name: normalizeItemName(item.name),
      image: img,
      size: item.size != null ? String(item.size) : "",
      quantity: Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1,
      price: Number.isFinite(p) ? p : 0,
      fabric: item.fabric != null ? String(item.fabric) : undefined,
      productColor: item.productColor != null ? String(item.productColor) : undefined,
      productColorHex: item.productColorHex != null ? String(item.productColorHex) : undefined,
    }
  }

  // Load cart from localStorage first so auth hydration respects an explicitly cleared cart ([]).
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const normalizedItems = parsed
              .map((item: unknown) => coerceCartItem(item))
              .filter((item): item is CartItem => item !== null)
            setCartItems(mergeDuplicateCartItems(normalizedItems))
          }
        } catch (error) {
          console.error("Error loading cart from localStorage:", error)
        }
      }
      setIsLoading(false)
    }
  }, [])

  // Fetch user info from auth verification endpoint and load user's saved cart from DB when appropriate
  useEffect(() => {
    const fetchUserInfoAndCart = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.email) {
            setUserEmail(data.user.email)
            // Store user info in localStorage for reference
            if (typeof window !== "undefined") {
              localStorage.setItem("user_email", data.user.email)
              localStorage.setItem("user_id", data.user.id || "")
              localStorage.setItem("user_fullname", data.user.fullname || "")
            }

            // Load user's saved cart from database after successful login
            if (data.user.id) {
              try {
                // If localStorage was explicitly cleared ([]), do not resurrect stale server cart
                let skipServerHydrate = false
                try {
                  const raw = localStorage.getItem(CART_STORAGE_KEY)
                  if (raw !== null) {
                    const parsed = JSON.parse(raw)
                    skipServerHydrate = Array.isArray(parsed) && parsed.length === 0
                  }
                } catch {
                  skipServerHydrate = false
                }

                if (skipServerHydrate) {
                  return
                }

                const cartResponse = await fetch(`/api/cart/get?userId=${data.user.id}`, {
                  method: "GET",
                  credentials: "include",
                })

                if (cartResponse.ok) {
                  const cartData = await cartResponse.json()
                  if (cartData.cart && cartData.cart.items && cartData.cart.items.length > 0) {
                    const normalizedItems = cartData.cart.items
                      .map((item: unknown) => coerceCartItem(item))
                      .filter((item): item is CartItem => item !== null)
                    setCartItems(mergeDuplicateCartItems(normalizedItems))
                  }
                }
              } catch (cartError) {
                console.error("[Cart] Error loading saved cart after login:", cartError)
              }
            }
          }
        } else {
          // User not logged in, use guest
          setUserEmail("guest@ananthala.com")
        }
      } catch (error) {
        console.error("[Cart] Error fetching user info:", error)
        setUserEmail("guest@ananthala.com")
      }
    }

    if (typeof window !== "undefined") {
      fetchUserInfoAndCart()
    }
  }, [])

  // Save cart to localStorage and database whenever it changes (debounced)
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      // Save to localStorage immediately
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))

      // Save to database with debounce (every 2 seconds max)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        const uid = typeof window !== "undefined" ? localStorage.getItem("user_id") : null
        if (cartItems.length > 0 || uid) {
          saveCartToDatabase(cartItems, userEmail)
        }
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [cartItems, isLoading, userEmail])

  // Function to save cart to database with user info
  const saveCartToDatabase = async (items: CartItem[], email: string) => {
    try {
      // Get stored user info
      const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null
      const userFullname = typeof window !== "undefined" ? localStorage.getItem("user_fullname") : null

      const response = await fetch("/api/cart/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for auth token
        body: JSON.stringify({
          email,
          userId,
          userFullname,
          items,
          userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[Cart] Error saving to database:", error.message)
      }
    } catch (error) {
      console.error("[Cart] Error saving cart to database:", error)
    }
  }

  const persistEmptyCartToServer = () => {
    if (typeof window === "undefined") return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    const uid = localStorage.getItem("user_id")
    if (!uid) return
    void saveCartToDatabase(
      [],
      userEmail || localStorage.getItem("user_email") || "guest@ananthala.com"
    )
  }

  const applyRemoteCart = useCallback((items: unknown[]) => {
    const normalized = items
      .map((item) => coerceCartItem(item))
      .filter((item): item is CartItem => item !== null)
    setCartItems(mergeDuplicateCartItems(normalized))
  }, [])

  const addToCart = (newItem: CartItem) => {
    const rawImage =
      typeof newItem.image === "string" && newItem.image.trim() ? newItem.image : String(newItem.image ?? "").trim()
    const normalizedItem = {
      ...newItem,
      name: normalizeItemName(newItem.name),
      size: newItem.size != null ? String(newItem.size) : "",
      image: rawImage || "/placeholder.svg",
    }
    const mergeKey = getCartItemMergeKey(normalizedItem)
    const existingItem = cartItems.find((item) => getCartItemMergeKey(item) === mergeKey)

    setCartItems((prevItems) => {
      // Merge by product configuration instead of generated id.
      const existingItemIndex = prevItems.findIndex(
        (item) => getCartItemMergeKey(item) === mergeKey
      )
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += normalizedItem.quantity
        return mergeDuplicateCartItems(updatedItems)
      }
      return mergeDuplicateCartItems([...prevItems, normalizedItem])
    })

    const { dismiss } = toast({
      title: existingItem ? "Cart updated" : "Added to cart",
      className:
        "cart-toast fixed left-1/2 top-1/2 z-100 w-[520px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 p-8 text-lg font-semibold",
      description: (
        <div className="mt-3 space-y-4">
          <p className="text-base leading-relaxed font-normal">
            {existingItem
              ? `${normalizedItem.name} quantity updated in your cart.`
              : `${normalizedItem.name} has been added to your cart.`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                dismiss()
                router.push("/cart")
              }}
              className="rounded-md bg-[#EED9C4] px-4 py-2 text-sm font-medium text-[#6D4530] transition-colors hover:bg-[#D9BB9B]"
            >
              Go to Cart
            </button>
            <button
              type="button"
              onClick={() => dismiss()}
              className="rounded-md bg-[#6D4530] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B3928]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ),
    })
  }

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const next = prevItems.filter((item) => item.id !== itemId)
      if (next.length === 0) {
        dismissAllToasts()
        queueMicrotask(() => persistEmptyCartToServer())
      }
      return next
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    dismissAllToasts()
    setCartItems([])
    setAppliedCoupons([])
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]))
    }
    persistEmptyCartToServer()
  }

  /** Only one coupon per order (general or agent offers cannot be stacked). */
  const handleSetAppliedCoupon = (coupon: any) => {
    if (appliedCoupons.find((c) => c.code === coupon.code)) {
      return
    }
    setAppliedCoupons([coupon])
  }

  const clearCoupon = (couponCode?: string) => {
    if (couponCode) {
      // Remove specific coupon
      setAppliedCoupons(appliedCoupons.filter((c) => c.code !== couponCode))
    } else {
      // Clear all coupons
      setAppliedCoupons([])
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        applyRemoteCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoading,
        appliedCoupons,
        setAppliedCoupon: handleSetAppliedCoupon,
        clearCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
