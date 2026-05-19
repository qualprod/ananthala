"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Image from "next/image"
import { IndianRupee, Trash2, Plus, Minus, ShoppingCart, ChevronRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart()

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const handleCheckout = () => {
    router.push("/checkout")
  }

  const getProductHref = (item: { id: string; productId?: string }) => {
    const explicitProductId = item.productId?.trim()
    if (explicitProductId) return `/product/${explicitProductId}`

    const objectIdMatch = item.id.match(/[a-f0-9]{24}/i)
    if (objectIdMatch) return `/product/${objectIdMatch[0]}`

    return null
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="pt-16 flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="empty-cart-icon-wrap">
              <ShoppingCart className="empty-cart-icon w-12 h-12 text-[#8B5A3C]/50" />
            </div>
            <h1 className="text-3xl font-serif text-foreground mb-4">Your Cart is Empty</h1>
            <p className="text-foreground mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <button
              onClick={() => router.push("/#shop")}
              className="px-8 py-3 text-foreground hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#EED9C4" }}
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F5F7]">
      <Header />
      <div
        className="fixed top-20 left-0 right-0 z-40 bg-white border-b"
        style={{ borderColor: "#D9CFC7" }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <nav className="py-2 ">
            <ol className="flex items-center gap-2 text-base">
              <li>
                <Link href="/" className="text-foreground hover:opacity-80 transition-opacity">
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="w-4 h-4 text-foreground/50" />
              </li>
              <li>
                <Link href="/#shop" className="text-foreground hover:opacity-80 transition-opacity">
                  Products
                </Link>
              </li>
              <li>
                <ChevronRight className="w-4 h-4 text-foreground/50" />
              </li>
              <li className="text-foreground">Cart</li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="h-[49px]"></div>
      <main className="pt-6 flex-1">
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h1 className="text-3xl font-serif text-foreground mt-4 mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item, index) => {
                  const isComplimentaryBedsheet = item.name.toLowerCase().includes("bed sheet (complimentary)")
                  const nextIsComplimentaryBedsheet = cartItems[index + 1]?.name
                    ?.toLowerCase()
                    .includes("bed sheet (complimentary)")

                  const containerClass = [
                    "flex gap-5 p-6 bg-white shadow-sm",
                    isComplimentaryBedsheet ? "-mt-6" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")

                  return (
                    <div key={item.id} className="space-y-4">
                      {/* Main Item */}
                      <div className={containerClass}>
                        {getProductHref(item) ? (
                          <Link
                            href={getProductHref(item)!}
                            className="flex gap-5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                            aria-label={`View ${item.name}`}
                          >
                            <div className="relative w-28 h-28 shrink-0 bg-gray-100 overflow-hidden rounded">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-semibold text-foreground mb-2">
                                {item.name}
                                {item.productColor && (
                                  <span className="text-sm font-normal text-foreground/70 ml-2">({item.productColor})</span>
                                )}
                              </h3>
                              <div className="space-y-2">
                                <div className="inline-block px-3 py-1 text-base text-foreground">
                                  {item.fabric ? `Fabric: ${item.fabric}` : `Size: ${item.size}`}
                                </div>
                                {item.productColor && (
                                  <div className="flex items-center gap-2 px-3 py-1 text-base text-foreground">
                                    <span>Color:</span>
                                    <div
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{ backgroundColor: item.productColorHex || "transparent" }}
                                      title={item.productColor}
                                    />
                                    <span>{item.productColor}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <>
                            <div className="relative w-28 h-28 shrink-0 bg-gray-100 overflow-hidden rounded">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-semibold text-foreground mb-2">
                                {item.name}
                                {item.productColor && (
                                  <span className="text-sm font-normal text-foreground/70 ml-2">({item.productColor})</span>
                                )}
                              </h3>
                              <div className="space-y-2">
                                <div className="inline-block px-3 py-1 text-base text-foreground">
                                  {item.fabric ? `Fabric: ${item.fabric}` : `Size: ${item.size}`}
                                </div>
                                {item.productColor && (
                                  <div className="flex items-center gap-2 px-3 py-1 text-base text-foreground">
                                    <span>Color:</span>
                                    <div
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{ backgroundColor: item.productColorHex || "transparent" }}
                                      title={item.productColor}
                                    />
                                    <span>{item.productColor}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2 border rounded-md px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-foreground hover:opacity-70 transition-opacity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-foreground w-6 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-foreground hover:opacity-70 transition-opacity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-semibold text-foreground">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-foreground hover:opacity-80 transition-opacity"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Complementary Items */}
                      {item.complementaryItems && item.complementaryItems.length > 0 && (
                        <div className="ml-6 pl-4 border-l-4 border-green-400 py-3 px-4 bg-green-50 rounded-r-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                              FREE
                            </span>
                            <span className="text-sm font-bold text-green-800">Complimentary Products Included</span>
                          </div>
                          <div className="space-y-2">
                            {item.complementaryItems.map((freeItem, idx) => (
                              <div key={`${item.id}-free-${idx}`} className="text-sm text-gray-700 pl-1 flex items-center">
                                <span className="text-green-600 mr-2">✓</span>
                                {freeItem.name || `Free Product ${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-foreground mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base text-foreground">Items Total Price</span>
                    <span className="text-foreground text-base font-semibold">
                      ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-center justify-between text-xl">
                    <span className="text-foreground font-semibold">Subtotal</span>
                    <span className="text-foreground font-bold">
                      ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 mt-2">Shipping & discounts will be applied at checkout</p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 text-foreground hover:opacity-90 transition-opacity mb-3 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#EED9C4" }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push("/#shop")}
                  className="w-full py-3 border text-foreground hover:opacity-70 transition-opacity bg-gray-100"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
