"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { type CartItem } from "@/components/cart/cart-drawer"
import { toast } from "@/hooks/use-toast"

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [appliedCoupons, setAppliedCoupons] = useState<any[]>([])

  const normalizeItemName = (name: string) => name.replace(/\bGRACE\b/g, "Grace")
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

  // Fetch user info from auth verification endpoint and load user's saved cart
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
                const cartResponse = await fetch(`/api/cart/get?userId=${data.user.id}`, {
                  method: "GET",
                  credentials: "include",
                })

                if (cartResponse.ok) {
                  const cartData = await cartResponse.json()
                  if (cartData.cart && cartData.cart.items && cartData.cart.items.length > 0) {
                    // Normalize and merge the loaded cart items
                    const normalizedItems = cartData.cart.items.map((item: any) =>
                      item && typeof item === "object" ? { ...item, name: normalizeItemName(item.name ?? "") } : item
                    )
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

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const normalizedItems = parsed.map((item) =>
              item && typeof item === "object" ? { ...item, name: normalizeItemName(item.name ?? "") } : item
            )
            setCartItems(mergeDuplicateCartItems(normalizedItems))
          }
        } catch (error) {
          console.error("Error loading cart from localStorage:", error)
        }
      }
      setIsLoading(false)
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
        if (cartItems.length > 0) {
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

  const addToCart = (newItem: CartItem) => {
    const normalizedItem = { ...newItem, name: normalizeItemName(newItem.name) }
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
      title: <span className="text-lg font-semibold">{existingItem ? "Cart updated" : "Added to cart"}</span>,
      className:
        "cart-toast fixed left-1/2 top-1/2 z-100 w-[520px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 p-8",
      description: (
        <div className="mt-3 space-y-4">
          <p className="text-base leading-relaxed">
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
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
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
    setCartItems([])
    setAppliedCoupons([])
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
