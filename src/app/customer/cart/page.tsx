"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, IndianRupee } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CartItem {
  id: string
  name: string
  image?: string
  quantity: number
  price: number
  size?: string
  fabric?: string
  productColor?: string
  productColorHex?: string
}

export default function CustomerCartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, updateQuantity } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Calculate totals using the context cart items
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = 0 // Free shipping for all orders
  const total = subtotal + shipping
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdatingItems((prev) => new Set([...prev, itemId]))
    try {
      updateQuantity(itemId, newQuantity)
      toast({
        description: "Quantity updated",
      })
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setUpdatingItems((prev) => new Set([...prev, itemId]))
    try {
      removeFromCart(itemId)
      toast({
        description: "Item removed from cart",
      })
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const isEmpty = cartItems.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        <p className="text-foreground mt-1">Review your items before checkout</p>
      </div>

      {isEmpty ? (
        <Card className="border" style={{ borderColor: "#D9CFC7" }}>
          <CardContent className="py-12">
            <div className="text-center">
              <ShoppingCart className="h-11 w-11 text-[#8B5A3C]/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-foreground mb-6">Add items to your cart to continue shopping</p>
              <a
                href="/#shop"
                className="inline-block bg-[#6D4530] text-white px-6 py-2 rounded-lg hover:bg-[#5A3A26] transition-colors"
              >
                Continue Shopping
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="border" style={{ borderColor: "#D9CFC7" }}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg bg-[#F5F1ED]"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      {(item.size || item.fabric || item.productColor) && (
                        <p className="text-sm text-foreground/70 mt-1">
                          {[item.size, item.fabric, item.productColor].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-[#F5F1ED] rounded-lg p-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1 hover:bg-white rounded disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1 hover:bg-white rounded disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-foreground/70">₹{item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingItems.has(item.id)}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border sticky top-6" style={{ borderColor: "#D9CFC7" }}>
              <CardHeader>
                <CardTitle className="text-foreground">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Shipping Charge</span>
                    <span className="text-green-600 font-semibold">Free</span>
                  </div>
                  <div className="border-t" style={{ borderColor: "#D9CFC7" }} />
                  <div className="flex justify-between font-bold text-lg text-foreground">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push("/checkout")}
                  className="w-full bg-[#6D4530] hover:bg-[#5A3A26] text-white"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
