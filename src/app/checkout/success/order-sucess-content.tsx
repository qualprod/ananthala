"use client"

import { useRouter } from "next/navigation"
import { CheckCircle, ShoppingBag, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OrderSuccessContent() {
  const router = useRouter()

  return (
    <main className="flex-1 py-12 md:py-24 px-4 md:px-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50"></div>
              <CheckCircle className="w-24 h-24 md:w-32 md:h-32 text-green-500 relative" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4 font-cormorant font-bold">
            Order Placed Successfully!
          </h1>
          
          <div className="space-y-3 text-stone-600">
            <p className="text-base md:text-lg leading-relaxed">
              Thank you for your order. We've received it and will send you a confirmation email shortly.
            </p>
            <p className="text-sm md:text-base">
              You can track your order status anytime from your account or use the button below.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 md:p-8 inline-block">
            <div className="space-y-2">
              <p className="text-sm md:text-base text-stone-600">
                <span className="font-semibold text-amber-700">Estimated Delivery:</span> 5-7 Business Days
              </p>
              <p className="text-sm md:text-base text-stone-600">
                <span className="font-semibold text-amber-700">Order Confirmation:</span> Check your email for details
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
          <Button
            onClick={() => router.push("/customer/orders")}
            className="flex-1 sm:flex-initial h-12 md:h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base md:text-lg rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Track Your Order</span>
          </Button>
          <Button
            onClick={() => router.push("/#shop")}
            className="flex-1 sm:flex-initial h-12 md:h-14 bg-white border-2 border-stone-300 hover:border-amber-500 text-foreground hover:text-amber-600 font-semibold text-base md:text-lg rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Continue Shopping</span>
          </Button>
        </div>

        {/* Support Info */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-sm md:text-base text-stone-600 mb-3">
            Need help? We're here for you!
          </p>
          <div className="text-xs md:text-sm text-stone-500 space-y-1">
            <p><strong>Email:</strong> qualprodsllp@gmail.com</p>
            <p><strong>Phone:</strong> +91 9071799966</p>
          </div>
        </div>
      </div>
    </main>
  )
}
