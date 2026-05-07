"use client"

import { X, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export interface ComplementaryItem {
  id: string
  name?: string
  image?: string
}

export interface CartItem {
  id: string
  productId?: string
  name: string
  image: string
  size: string
  fabric?: string
  productColor?: string // Color selected from color configurator
  productColorHex?: string // HEX value of color
  quantity: number
  price: number
  complementaryItems?: ComplementaryItem[] // Free products included
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cartItems?: CartItem[]
}

export function CartDrawer({ isOpen, onClose, cartItems = [] }: CartDrawerProps) {
  const router = useRouter()
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const getProductHref = (item: CartItem) => {
    const explicitProductId = item.productId?.trim()
    if (explicitProductId) return `/product/${explicitProductId}`

    const objectIdMatch = item.id.match(/[a-f0-9]{24}/i)
    if (objectIdMatch) return `/product/${objectIdMatch[0]}`

    return null
  }

  const handleCheckout = () => {
    onClose()
    router.push("/checkout")
  }

  const handleContinueShopping = () => {
    onClose()
    router.push("/")
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" onClick={onClose} />}

      {/* Cart Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-serif text-black">CART</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-black hover:bg-gray-100">
              <X className="h-6 w-6" />
              <span className="sr-only">Close cart</span>
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="empty-cart-icon-wrap">
                  <ShoppingBag className="empty-cart-icon h-11 w-11 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
                <p className="text-gray-400 text-sm">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="pb-6 border-b border-gray-100 space-y-4">
                    {/* Main Item */}
                    {getProductHref(item) ? (
                      <Link
                        href={getProductHref(item)!}
                        onClick={onClose}
                        className="flex gap-4 hover:opacity-80 transition-opacity"
                        aria-label={`View ${item.name}`}
                      >
                        <div className="relative w-24 h-24 shrink-0 bg-gray-100 overflow-hidden">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-black text-lg mb-2 leading-tight">
                            {item.name}
                            {item.productColor && (
                              <span className="text-sm font-normal text-gray-600 ml-1">({item.productColor})</span>
                            )}
                          </h3>
                          <p className="text-black text-sm mb-2">Size: {item.size}</p>
                          {item.fabric && (
                            <p className="text-black text-sm mb-2">Fabric: {item.fabric}</p>
                          )}
                          {item.productColor && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-black text-sm">Color:</span>
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: item.productColorHex || "transparent" }}
                                title={item.productColor}
                              />
                              <span className="text-black text-sm">{item.productColor}</span>
                            </div>
                          )}
                          <p className="text-black text-sm">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-black font-medium text-lg">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 shrink-0 bg-gray-100 overflow-hidden">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-black text-lg mb-2 leading-tight">
                            {item.name}
                            {item.productColor && (
                              <span className="text-sm font-normal text-gray-600 ml-1">({item.productColor})</span>
                            )}
                          </h3>
                          <p className="text-black text-sm mb-2">Size: {item.size}</p>
                          {item.fabric && (
                            <p className="text-black text-sm mb-2">Fabric: {item.fabric}</p>
                          )}
                          {item.productColor && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-black text-sm">Color:</span>
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: item.productColorHex || "transparent" }}
                                title={item.productColor}
                              />
                              <span className="text-black text-sm">{item.productColor}</span>
                            </div>
                          )}
                          <p className="text-black text-sm">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-black font-medium text-lg">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Complementary Items */}
                    {item.complementaryItems && item.complementaryItems.length > 0 && (
                      <div className="ml-4 pl-4 border-l-2 border-green-300 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">FREE</span>
                          <span className="text-xs text-gray-600">Complimentary Products</span>
                        </div>
                        {item.complementaryItems.map((freeItem, idx) => (
                          <div key={`${item.id}-free-${idx}`} className="text-xs text-gray-700">
                            • {freeItem.name || `Free Product ${idx + 1}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-black font-medium">Subtotal</span>
                  <span className="text-black font-semibold">
                    ₹{subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full text-black py-6 text-lg font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#EED9C4" }}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-2 py-6 text-lg font-medium transition-colors bg-transparent text-black hover:opacity-70"
                  style={{ borderColor: "#D9CFC7" }}
                  onClick={handleContinueShopping}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
