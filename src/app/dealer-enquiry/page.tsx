"use client"

import type React from "react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CountryCodeSelect } from "@/components/ui/country-code-select"
import { DEFAULT_COUNTRY_CODE } from "@/lib/country-codes"
import { withCountryCode } from "@/lib/phone"

export default function DealerEnquiry() {
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    businessType: "",
    retailSpace: "",
    inventory: "",
    message: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const payload = {
        ...formData,
        phone: withCountryCode(`${countryCode}${formData.phone}`, countryCode),
      }
      console.log("[v0] Submitting dealer enquiry with data:", payload)
      const response = await fetch("/api/dealer-enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] API Response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit application")
      }

      setSubmitted(true)
      setFormData({
        businessName: "",
        ownerName: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        businessType: "",
        retailSpace: "",
        inventory: "",
        message: "",
      })
      setCountryCode(DEFAULT_COUNTRY_CODE)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: any) {
      console.error("[v0] Form submission error:", err)
      setError(err.message || "Failed to submit application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-stone-50 to-white py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1
              className="text-4xl md:text-5xl font-medium text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Become a Dealer
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto font-medium">
              Partner with Ananthala and bring premium comfort to your customers. Join our growing network of dealers
              across the country.
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-medium text-foreground mb-12 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Why Partner With Us?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                { title: "Premium Product", desc: "100% certified organic mattresses" },
                { title: "Competitive Margins", desc: "Attractive dealer pricing & discounts" },
                { title: "Marketing Support", desc: "Co-op marketing & promotional materials" },
                { title: "Bulk Orders", desc: "Flexible order quantities & delivery" },
                { title: "Dedicated Support", desc: "Dealer support team available 24/7" },
                { title: "Training Program", desc: "Product training & sales support" },
              ].map((benefit, idx) => (
                <div key={idx} className="border border-amber-100 p-6 md:p-8 hover:shadow-lg transition-all">
                  <h3 className="text-xl font-medium text-[#8B5A3C] mb-2">{benefit.title}</h3>
                  <p className="text-foreground/80 font-medium">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enquiry Form Section */}
        <section className="py-16 md:py-24 px-4 bg-stone-50">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-medium text-foreground mb-8 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Apply Now
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground font-medium mb-2">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    placeholder="Your Business Name"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-2">Owner Name *</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-2">Phone *</label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      id="dealer-country-code"
                      value={countryCode}
                      onChange={setCountryCode}
                      disabled={isLoading}
                      className="w-44 px-3 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground font-medium mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground font-medium mb-2">Business Type *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                  >
                    <option value="">Select Type</option>
                    <option value="furniture">Furniture Store</option>
                    <option value="bedding">Bedding Specialist</option>
                    <option value="home">Home Decor</option>
                    <option value="online">Online Retailer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-2">Retail Space (sq ft) *</label>
                  <input
                    type="text"
                    name="retailSpace"
                    value={formData.retailSpace}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">Initial Inventory Interest *</label>
                <select
                  name="inventory"
                  value={formData.inventory}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] disabled:opacity-50"
                >
                  <option value="">Select Range</option>
                  <option value="5-10">5-10 units</option>
                  <option value="10-20">10-20 units</option>
                  <option value="20-50">20-50 units</option>
                  <option value="50+">50+ units</option>
                </select>
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">Additional Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={4}
                  className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] resize-none disabled:opacity-50"
                  placeholder="Tell us about your business..."
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#8B5A3C] hover:bg-[#6B563F] text-white font-medium py-3 transition-colors disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-center font-medium">
                  ✗ {error}
                </div>
              )}

              {submitted && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-center font-medium">
                  ✓ Your application submitted and under review. Team will contact you in 2-3 working days.
                </div>
              )}
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
