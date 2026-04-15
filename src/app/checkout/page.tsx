"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Image from "next/image"
import { IndianRupee, ShoppingCart, ChevronRight, MapPin, Check, AlertCircle, Building2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { getAllStates, getCitiesForState } from "@/lib/indian-states-cities"
import { useToast } from "@/hooks/use-toast"

interface SavedAddress {
  _id: string
  label: string
  houseNumber: string
  crossStreet: string
  locality: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault?: boolean
}

interface UserProfile {
  fullname: string
  email: string
  phone: string
  addresses: SavedAddress[]
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, clearCart, appliedCoupon, setAppliedCoupon, clearCoupon } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [allStates, setAllStates] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState("")
  const { toast } = useToast()
  
  // Saved address states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  
  // Billing address states
  const [billingDifferent, setBillingDifferent] = useState(false)
  const [billingAllStates, setBillingAllStates] = useState<string[]>([])
  
  // GST states
  const [hasGST, setHasGST] = useState(false)
  const [gstNumber, setGstNumber] = useState("")
  const [companyName, setCompanyName] = useState("")
  
  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    paymentMethod: "razorpay",
  })

  const [billingData, setBillingData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  })

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") {
        resolve(false)
        return
      }
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

useEffect(() => {
    const ensureAuthenticated = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          credentials: "include",
        })
        const data = await response.json()
        if (!data?.success) {
          setIsAuthChecking(false)
          router.replace("/login?redirect=/checkout")
          return
        }
        // User is authenticated
        setIsAuthenticated(true)
        setIsAuthChecking(false)
        
        // Fetch user profile with saved addresses
        fetchUserProfile()
      } catch (error) {
        console.error("[Checkout] Auth check error:", error)
        setIsAuthChecking(false)
        router.replace("/login?redirect=/checkout")
      }
    }

    ensureAuthenticated()
  }, [router])

  // Fetch user profile and saved addresses
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/customer/profile", {
        credentials: "include",
      })
      const data = await response.json()
      if (data.success && data.user) {
        setUserProfile(data.user)
        
        // Pre-fill name, email, phone from profile
        const nameParts = data.user.fullname?.split(" ") || []
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        }))
        
        // If user has saved addresses, select the default one or first one
        if (data.user.addresses && data.user.addresses.length > 0) {
          const defaultAddr = data.user.addresses.find((a: SavedAddress) => a.isDefault) || data.user.addresses[0]
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id)
            applySelectedAddress(defaultAddr)
          }
        } else {
          setUseNewAddress(true)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  // Apply selected address to form
  const applySelectedAddress = (address: SavedAddress) => {
    const fullAddress = [
      address.houseNumber,
      address.crossStreet,
      address.locality,
      address.landmark
    ].filter(Boolean).join(", ")
    
    setFormData(prev => ({
      ...prev,
      address: fullAddress,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
      country: address.country || "India",
    }))
  }

  // Handle saved address selection
  const handleAddressSelection = (addressId: string) => {
    if (addressId === "new") {
      setUseNewAddress(true)
      setSelectedAddressId(null)
      setFormData(prev => ({
        ...prev,
        address: "",
        city: "",
        state: "",
        zipCode: "",
      }))
    } else {
      setUseNewAddress(false)
      setSelectedAddressId(addressId)
      const selectedAddr = userProfile?.addresses.find(a => a._id === addressId)
      if (selectedAddr) {
        applySelectedAddress(selectedAddr)
      }
    }
  }

  // Load states data from package
  useEffect(() => {
    const loadStates = async () => {
      try {
        const states = await getAllStates()
        setAllStates(states)
      } catch (error) {
        console.error("Error loading states data:", error)
      }
    }
    loadStates()
  }, [])

// Load billing states
  useEffect(() => {
    const loadBillingStates = async () => {
      try {
        const states = await getAllStates()
        setBillingAllStates(states)
      } catch (error) {
        console.error("Error loading billing states:", error)
      }
    }
    if (billingDifferent) {
      loadBillingStates()
    }
  }, [billingDifferent])

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  
  // Calculate total quantity of all items
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  
  // Check if address is properly filled
  const isAddressComplete = formData.address.trim() && formData.state && formData.city && formData.zipCode && /^\d{6}$/.test(formData.zipCode)
  
  // Shipping formula: 120 for first product, +20 for each additional product
  // Only calculate shipping if address is complete
  // Example: 1 product = 120, 2 products = 140, 3 products = 160
  const shipping = (isAddressComplete && totalQuantity > 0) ? 120 + (Math.max(0, totalQuantity - 1) * 20) : 0
  
  // Calculate discount based on applied coupon
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const total = subtotal - discount + shipping

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    if (cartItems.length === 0) {
      setCouponError("Your cart is empty")
      return
    }

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: subtotal,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          discountAmount: data.coupon.discountAmount,
          type: data.coupon.type,
          discount: data.coupon.discount,
        })
        setCouponError("")
      } else {
        setCouponError(data.error || "Invalid coupon code")
        clearCoupon()
      }
    } catch (error) {
      console.error("Error validating coupon:", error)
      setCouponError("Error validating coupon. Please try again.")
      clearCoupon()
    }
  }

  const removeCoupon = () => {
    clearCoupon()
    setCouponCode("")
    setCouponError("")
  }

const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
      // Reset city when state changes
      ...(name === "state" && { city: "" }),
    })
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleBillingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setBillingData({
      ...billingData,
      [name]: value,
      ...(name === "state" && { city: "" }),
    })
    // Clear field error when user starts typing
    const billingFieldName = `billing_${name}`
    if (fieldErrors[billingFieldName]) {
      setFieldErrors(prev => ({ ...prev, [billingFieldName]: "" }))
    }
  }

  // Validate GST number format (Indian GST)
  const validateGSTNumber = (gst: string) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstRegex.test(gst.toUpperCase())
  }

  // Validate all required fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Required shipping fields
    if (!formData.firstName.trim()) errors.firstName = "First name is required"
    if (!formData.lastName.trim()) errors.lastName = "Last name is required"
    if (!formData.email.trim()) errors.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = "Invalid email format"
    if (!formData.phone.trim()) errors.phone = "Phone number is required"
    else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ""))) errors.phone = "Invalid phone number"
    if (!formData.address.trim()) errors.address = "Address is required"
    if (!formData.state) errors.state = "State is required"
    if (!formData.city) errors.city = "City is required"
    if (!formData.zipCode.trim()) errors.zipCode = "ZIP code is required"
    else if (!/^\d{6}$/.test(formData.zipCode)) errors.zipCode = "ZIP code must be 6 digits"
    
    // Billing address validation if different
    if (billingDifferent) {
      if (!billingData.firstName.trim()) errors.billing_firstName = "First name is required"
      if (!billingData.lastName.trim()) errors.billing_lastName = "Last name is required"
      if (!billingData.address.trim()) errors.billing_address = "Address is required"
      if (!billingData.state) errors.billing_state = "State is required"
      if (!billingData.city) errors.billing_city = "City is required"
      if (!billingData.zipCode.trim()) errors.billing_zipCode = "ZIP code is required"
      else if (!/^\d{6}$/.test(billingData.zipCode)) errors.billing_zipCode = "ZIP code must be 6 digits"
    }
    
    // GST validation if provided
    if (hasGST) {
      if (!gstNumber.trim()) errors.gstNumber = "GST number is required"
      else if (!validateGSTNumber(gstNumber)) errors.gstNumber = "Invalid GST number format"
      if (!companyName.trim()) errors.companyName = "Company name is required for GST"
    }
    
    setFieldErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0]
      const element = document.querySelector(`[name="${firstErrorField.replace('billing_', '')}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      
      toast({
        title: "Please fill all required fields",
        description: "Some mandatory fields are missing or invalid.",
        variant: "destructive",
      })
      return false
    }
    
    return true
  }

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before processing
    if (!validateForm()) {
      return
    }
    
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please try again.")
      }
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error("Razorpay key is missing. Please configure NEXT_PUBLIC_RAZORPAY_KEY_ID.")
      }

      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: "INR",
          receipt: `order_${Date.now()}`,
          notes: {
            customer: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
          },
        }),
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || !orderData?.order?.id) {
        throw new Error(orderData?.message || "Failed to create payment order.")
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Ananthala",
        description: "Order Payment",
        image: "/logo.png",
        order_id: orderData.order.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customer: {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                },
shippingAddress: {
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode,
                  country: formData.country,
                },
                billingAddress: billingDifferent ? {
                  firstName: billingData.firstName,
                  lastName: billingData.lastName,
                  address: billingData.address,
                  city: billingData.city,
                  state: billingData.state,
                  zipCode: billingData.zipCode,
                  country: billingData.country,
                } : null,
                gstDetails: hasGST ? {
                  gstNumber: gstNumber.toUpperCase(),
                  companyName: companyName,
                } : null,
                items: cartItems.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  size: item.size,
                  fabric: item.fabric,
                  productColor: item.productColor,
                  productColorHex: item.productColorHex,
                  complementaryItems: item.complementaryItems && item.complementaryItems.length > 0 
                    ? item.complementaryItems.map((comp) => ({
                        id: comp.id,
                        name: comp.name,
                      }))
                    : undefined,
                })),
                subtotal,
                shippingCost: shipping,
                discount: discount,
                couponCode: appliedCoupon?.code || null,
                totalAmount: total,
                paymentMethod: formData.paymentMethod,
              }),
            })

            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok || !verifyData?.success) {
              throw new Error(verifyData?.message || "Payment verification failed.")
            }

            clearCart()
            const orderId = verifyData.orderId
            router.push(`/checkout/success?orderId=${orderId}`)
          } catch (error: any) {
            setErrorMessage(error?.message || "Payment verification failed.")
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
          },
        },
        theme: { color: "#EED9C4" },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", (response: any) => {
        setErrorMessage(response?.error?.description || "Payment failed. Please try again.")
        setIsProcessing(false)
      })
      razorpay.open()
    } catch (error: any) {
      setErrorMessage(error?.message || "Payment failed. Please try again.")
      setIsProcessing(false)
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] font-roboto flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="w-12 h-12 border-4 border-[#D9CFC7] border-t-[#8B5A3C] rounded-full"></div>
            </div>
            <p className="mt-4 text-[#6D4530] text-lg">Verifying your session...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-16 min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-3xl font-serif text-foreground mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-foreground mb-8">
              Please add items to your cart before checkout.
            </p>
            <button
              onClick={() => router.push("/#find-your-perfect-mattress")}
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
    <div className="min-h-screen bg-white">
      <Header />
      <div
        className="fixed top-20 left-0 right-0 z-40 bg-white border-b"
        style={{ borderColor: "#D9CFC7" }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <nav className="py-2">
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
                <Link href="/#find-your-perfect-mattress" className="text-foreground hover:opacity-80 transition-opacity">
                  Products
                </Link>
              </li>
              <li>
                <ChevronRight className="w-4 h-4 text-foreground/50" />
              </li>
              <li>
                <Link href="/cart" className="text-foreground hover:opacity-80 transition-opacity">
                  Cart
                </Link>
              </li>
              <li>
                <ChevronRight className="w-4 h-4 text-foreground/50" />
              </li>
              <li className="text-foreground">Checkout</li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="h-[49px]"></div>
      <main className="pt-6">
        <div className="max-w-7xl mx-auto px-4 py-12">
          

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
{/* Contact Information */}
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-black mb-6">
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-black mb-2 text-lg font-medium">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.firstName ? "border-red-500 bg-red-50" : ""}`}
                          style={{ borderColor: fieldErrors.firstName ? undefined : "#D9CFC7" }}
                        />
                        {fieldErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {fieldErrors.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-black mb-2 text-lg font-medium">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.lastName ? "border-red-500 bg-red-50" : ""}`}
                          style={{ borderColor: fieldErrors.lastName ? undefined : "#D9CFC7" }}
                        />
                        {fieldErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {fieldErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-black mb-2 text-lg font-medium">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.email ? "border-red-500 bg-red-50" : ""}`}
                        style={{ borderColor: fieldErrors.email ? undefined : "#D9CFC7" }}
                      />
                      {fieldErrors.email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-black mb-2 text-lg font-medium">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10 digit mobile number"
                        className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.phone ? "border-red-500 bg-red-50" : ""}`}
                        style={{ borderColor: fieldErrors.phone ? undefined : "#D9CFC7" }}
                      />
                      {fieldErrors.phone && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {fieldErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-black mb-6">
                    Shipping Address
                  </h2>
                  
                  {/* Saved Addresses */}
                  {userProfile?.addresses && userProfile.addresses.length > 0 && (
                    <div className="mb-6">
                      <p className="text-black font-medium mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#8B5A3C]" />
                        Select from saved addresses
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userProfile.addresses.map((addr) => (
                          <div
                            key={addr._id}
                            onClick={() => handleAddressSelection(addr._id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedAddressId === addr._id && !useNewAddress
                                ? "border-[#8B5A3C] bg-[#F5F1ED] ring-2 ring-[#8B5A3C]"
                                : "border-[#D9CFC7] hover:border-[#8B5A3C]"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${
                                  addr.label === "Home" ? "bg-blue-100 text-blue-700" :
                                  addr.label === "Office" ? "bg-purple-100 text-purple-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {addr.label}
                                  {addr.isDefault && " (Default)"}
                                </span>
                                <p className="text-sm text-black">
                                  {addr.houseNumber}, {addr.crossStreet}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {addr.locality}{addr.landmark ? `, ${addr.landmark}` : ""}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                              </div>
                              {selectedAddressId === addr._id && !useNewAddress && (
                                <Check className="w-5 h-5 text-[#8B5A3C]" />
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Add New Address Option */}
                        <div
                          onClick={() => handleAddressSelection("new")}
                          className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-center ${
                            useNewAddress
                              ? "border-[#8B5A3C] bg-[#F5F1ED] ring-2 ring-[#8B5A3C]"
                              : "border-dashed border-[#D9CFC7] hover:border-[#8B5A3C]"
                          }`}
                        >
                          <div className="text-center">
                            <MapPin className="w-8 h-8 text-[#8B5A3C] mx-auto mb-2" />
                            <p className="text-sm font-medium text-black">Use a different address</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* New Address Form - Show if no saved addresses or user wants new address */}
                  {(useNewAddress || !userProfile?.addresses?.length) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-black mb-2 text-lg font-medium">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="House/Flat No., Street, Locality, Landmark"
                          className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.address ? "border-red-500 bg-red-50" : ""}`}
                          style={{ borderColor: fieldErrors.address ? undefined : "#D9CFC7" }}
                        />
                        {fieldErrors.address && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {fieldErrors.address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-black mb-2 text-lg font-medium">
                            State <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border text-black bg-white text-lg ${fieldErrors.state ? "border-red-500 bg-red-50" : ""}`}
                            style={{ borderColor: fieldErrors.state ? undefined : "#D9CFC7" }}
                          >
                            <option value="">Select State</option>
                            {allStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.state && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {fieldErrors.state}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-black mb-2 text-lg font-medium">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Enter your city"
                            className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.city ? "border-red-500 bg-red-50" : ""}`}
                            style={{ borderColor: fieldErrors.city ? undefined : "#D9CFC7" }}
                          />
                          {fieldErrors.city && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {fieldErrors.city}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-black mb-2 text-lg font-medium">
                            PIN Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            maxLength={6}
                            placeholder="6 digit PIN"
                            className={`w-full px-4 py-3 border text-black text-lg ${fieldErrors.zipCode ? "border-red-500 bg-red-50" : ""}`}
                            style={{ borderColor: fieldErrors.zipCode ? undefined : "#D9CFC7" }}
                          />
                          {fieldErrors.zipCode && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {fieldErrors.zipCode}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-black mb-2 text-lg font-medium">Country</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          disabled
                          className="w-full px-4 py-3 border text-black bg-gray-100 cursor-not-allowed text-lg"
                          style={{ borderColor: "#D9CFC7" }}
                        >
                          <option value="India">India</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Show selected address summary when using saved address */}
                  {selectedAddressId && !useNewAddress && (
                    <div className="mt-4 p-4 bg-[#F5F1ED] rounded-lg border border-[#E5D5C5]">
                      <p className="text-sm font-medium text-[#6D4530] mb-2">Shipping to:</p>
                      <p className="text-black">{formData.address}</p>
                      <p className="text-gray-600">{formData.city}, {formData.state} - {formData.zipCode}</p>
                    </div>
                  )}
                </div>

                {/* Billing Address Option */}
                <div className="border-t pt-6" style={{ borderColor: "#D9CFC7" }}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billingDifferent}
                      onChange={(e) => setBillingDifferent(e.target.checked)}
                      className="w-5 h-5 rounded border-[#D9CFC7] text-[#8B5A3C] focus:ring-[#8B5A3C]"
                    />
                    <span className="text-black text-lg font-medium">
                      Billing address is different from shipping address
                    </span>
                  </label>

                  {billingDifferent && (
                    <div className="mt-6 p-4 border rounded-lg" style={{ borderColor: "#D9CFC7" }}>
                      <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#8B5A3C]" />
                        Billing Address
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-black mb-2 font-medium">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={billingData.firstName}
                              onChange={handleBillingInputChange}
                              className={`w-full px-4 py-3 border text-black ${fieldErrors.billing_firstName ? "border-red-500 bg-red-50" : ""}`}
                              style={{ borderColor: fieldErrors.billing_firstName ? undefined : "#D9CFC7" }}
                            />
                            {fieldErrors.billing_firstName && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {fieldErrors.billing_firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-black mb-2 font-medium">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={billingData.lastName}
                              onChange={handleBillingInputChange}
                              className={`w-full px-4 py-3 border text-black ${fieldErrors.billing_lastName ? "border-red-500 bg-red-50" : ""}`}
                              style={{ borderColor: fieldErrors.billing_lastName ? undefined : "#D9CFC7" }}
                            />
                            {fieldErrors.billing_lastName && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {fieldErrors.billing_lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-black mb-2 font-medium">
                            Address <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="address"
                            value={billingData.address}
                            onChange={handleBillingInputChange}
                            rows={3}
                            className={`w-full px-4 py-3 border text-black ${fieldErrors.billing_address ? "border-red-500 bg-red-50" : ""}`}
                            style={{ borderColor: fieldErrors.billing_address ? undefined : "#D9CFC7" }}
                          />
                          {fieldErrors.billing_address && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {fieldErrors.billing_address}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-black mb-2 font-medium">
                              State <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="state"
                              value={billingData.state}
                              onChange={handleBillingInputChange}
                              className={`w-full px-4 py-3 border text-black bg-white ${fieldErrors.billing_state ? "border-red-500 bg-red-50" : ""}`}
                              style={{ borderColor: fieldErrors.billing_state ? undefined : "#D9CFC7" }}
                            >
                              <option value="">Select State</option>
                              {billingAllStates.map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                            {fieldErrors.billing_state && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {fieldErrors.billing_state}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-black mb-2 font-medium">
                              City <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={billingData.city}
                              onChange={handleBillingInputChange}
                              placeholder="Enter your city"
                              className={`w-full px-4 py-3 border text-black ${fieldErrors.billing_city ? "border-red-500 bg-red-50" : ""}`}
                              style={{ borderColor: fieldErrors.billing_city ? undefined : "#D9CFC7" }}
                            />
                            {fieldErrors.billing_city && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {fieldErrors.billing_city}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-black mb-2 font-medium">
                              PIN Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="zipCode"
                              value={billingData.zipCode}
                              onChange={handleBillingInputChange}
                              maxLength={6}
                              className={`w-full px-4 py-3 border text-black ${fieldErrors.billing_zipCode ? "border-red-500 bg-red-50" : ""}`}
                              style={{ borderColor: fieldErrors.billing_zipCode ? undefined : "#D9CFC7" }}
                            />
                            {fieldErrors.billing_zipCode && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {fieldErrors.billing_zipCode}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-black mb-2 font-medium">Country</label>
                          <select
                            name="country"
                            value={billingData.country}
                            onChange={handleBillingInputChange}
                            disabled
                            className="w-full px-4 py-3 border text-black bg-gray-100 cursor-not-allowed"
                            style={{ borderColor: "#D9CFC7" }}
                          >
                            <option value="India">India</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* GST Details */}
                <div className="border-t pt-6" style={{ borderColor: "#D9CFC7" }}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasGST}
                      onChange={(e) => setHasGST(e.target.checked)}
                      className="w-5 h-5 rounded border-[#D9CFC7] text-[#8B5A3C] focus:ring-[#8B5A3C]"
                    />
                    <span className="text-black text-lg font-medium">
                      I have a GST number (for business purchases)
                    </span>
                  </label>

                  {hasGST && (
                    <div className="mt-6 p-4 border rounded-lg bg-[#FAFAFA]" style={{ borderColor: "#D9CFC7" }}>
                      <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#8B5A3C]" />
                        GST Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-black mb-2 font-medium">
                            GST Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={gstNumber}
                            onChange={(e) => {
                              setGstNumber(e.target.value.toUpperCase())
                              if (fieldErrors.gstNumber) setFieldErrors(prev => ({ ...prev, gstNumber: "" }))
                            }}
                            placeholder="e.g., 22AAAAA0000A1Z5"
                            maxLength={15}
                            className={`w-full px-4 py-3 border text-black uppercase ${fieldErrors.gstNumber ? "border-red-500 bg-red-50" : ""}`}
                            style={{ borderColor: fieldErrors.gstNumber ? undefined : "#D9CFC7" }}
                          />
                          {fieldErrors.gstNumber && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {fieldErrors.gstNumber}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Format: 2 digits state code + 10 char PAN + 1 entity code + Z + 1 check digit
                          </p>
                        </div>

                        <div>
                          <label className="block text-black mb-2 font-medium">
                            Company / Business Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value)
                              if (fieldErrors.companyName) setFieldErrors(prev => ({ ...prev, companyName: "" }))
                            }}
                            placeholder="Enter registered company name"
                            className={`w-full px-4 py-3 border text-black ${fieldErrors.companyName ? "border-red-500 bg-red-50" : ""}`}
                            style={{ borderColor: fieldErrors.companyName ? undefined : "#D9CFC7" }}
                          />
                          {fieldErrors.companyName && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {fieldErrors.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-black mb-6">
                    Payment Method
                  </h2>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={formData.paymentMethod === "razorpay"}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-black text-lg">Razorpay (UPI, Card, Netbanking)</span>
                    </label>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-sm text-red-600" role="alert">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 text-black hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
                  style={{ backgroundColor: "#EED9C4" }}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6" />
                      Place Order
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div
                className="border p-6 sticky top-24"
                style={{ borderColor: "#D9CFC7" }}
              >
                <h2 className="text-xl md:text-2xl font-serif text-black mb-6">
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-5 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="space-y-3">
                      {/* Main Item */}
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 shrink-0 bg-gray-100 overflow-hidden rounded">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-black text-base md:text-lg font-medium line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 text-sm md:text-base">Size: {item.size}</p>
                          <p className="text-gray-600 text-sm md:text-base">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-black text-base md:text-lg font-medium">
                            <IndianRupee className="w-4 h-4" />
                            <span>
                              {(item.price * item.quantity).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complementary Items */}
                      {item.complementaryItems && item.complementaryItems.length > 0 && (
                        <div className="ml-4 pl-3 border-l-4 border-green-300 py-2 space-y-2 bg-green-50 px-3 rounded-r">
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                              FREE
                            </span>
                            <span className="text-xs font-semibold text-green-700">Complimentary Products</span>
                          </div>
                          <div className="space-y-1">
                            {item.complementaryItems.map((freeItem, idx) => (
                              <div key={`${item.id}-free-${idx}`} className="text-xs text-gray-700 pl-2">
                                • {freeItem.name || `Free Product ${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Coupon Input Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border" style={{ borderColor: "#D9CFC7" }}>
                  <h3 className="text-sm font-semibold text-black mb-3">Apply Coupon Code</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm text-black focus:outline-none"
                      style={{ borderColor: "#D9CFC7" }}
                    />
                    <button
                      onClick={appliedCoupon ? removeCoupon : applyCoupon}
                      className="px-4 py-2 text-sm text-black bg-gray-200 hover:bg-gray-300 transition-colors rounded-md"
                    >
                      {appliedCoupon ? "Remove" : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-600">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-xs text-green-600 mt-2">✓ Coupon "{appliedCoupon.code}" applied successfully</p>
                  )}
                </div>

                <div
                  className="border-t pt-4 mb-4"
                  style={{ borderColor: "#D9CFC7" }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-base md:text-lg">
                      <span className="text-black font-medium">Subtotal</span>
                      <span className="text-black">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          <span>
                            {subtotal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-base md:text-lg">
                        <span className="text-black font-medium">Discount ({appliedCoupon.code})</span>
                        <span className="text-green-600 font-semibold">
                          <div className="flex items-center gap-1">
                            <span>-</span>
                            <IndianRupee className="w-4 h-4" />
                            <span>
                              {discount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </span>
                      </div>
                    )}
                    {isAddressComplete ? (
                      <div className="flex items-center justify-between text-base md:text-lg">
                        <span className="text-black font-medium">Shipping Charge</span>
                        <span className="text-black">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            <span>
                              {shipping.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-base md:text-lg">
                        <span className="text-gray-500 font-medium">Shipping Charge</span>
                        <span className="text-gray-400 text-sm">Add address to calculate</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="border-t pt-4"
                  style={{ borderColor: "#D9CFC7" }}
                >
                  <div className="flex items-center justify-between text-2xl md:text-3xl">
                    <span className="text-black text-xl font-semibold">Total</span>
                    <span className="text-black font-bold text-xl">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-6 h-6" />
                        <span>
                          {total.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
