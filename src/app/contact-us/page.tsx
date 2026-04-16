"use client"

import type React from "react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { useState } from "react"
import { CountryCodeSelect } from "@/components/ui/country-code-select"
import { DEFAULT_COUNTRY_CODE } from "@/lib/country-codes"
import { withCountryCode } from "@/lib/phone"

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        phone: formData.phone ? withCountryCode(`${countryCode}${formData.phone}`, countryCode) : "",
      }
      console.log("[v0] Submitting contact form with data:", payload)
      const response = await fetch("/api/contact-us", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] API Response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit form")
      }

      setSubmitted(true)
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
      setCountryCode(DEFAULT_COUNTRY_CODE)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: any) {
      console.error("[v0] Form submission error:", err)
      setError(err.message || "Failed to submit form. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-stone-50 py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1
              className="text-4xl md:text-5xl font-medium text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto font-medium">
              Have a question about our mattresses? We're here to help. Reach out to us anytime.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
              {/* Phone */}
              <div className="border border-amber-100 p-8 text-center hover:shadow-lg transition-shadow">
                <Phone className="w-8 h-8 text-[#8B5A3C] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Phone</h3>
                <p className="text-foreground/80 font-medium">1-800-SLEEP-WELL</p>
                <p className="text-sm text-foreground/60 mt-2">Available 24/7</p>
              </div>

              {/* Email */}
              <div className="border border-amber-100 p-8 text-center hover:shadow-lg transition-shadow">
                <Mail className="w-8 h-8 text-[#8B5A3C] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Email</h3>
                <p className="text-foreground/80 font-medium">support@ananthala.com</p>
                <p className="text-sm text-foreground/60 mt-2">We'll respond within 24 hours</p>
              </div>

              {/* Address */}
              <div className="border border-amber-100 p-8 text-center hover:shadow-lg transition-shadow">
                <MapPin className="w-8 h-8 text-[#8B5A3C] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Address</h3>
                <p className="text-foreground/80 font-medium">123 Sleep Street</p>
                <p className="text-sm text-foreground/60">San Francisco, CA</p>
              </div>

              {/* Hours */}
              <div className="border border-amber-100 p-8 text-center hover:shadow-lg transition-shadow">
                <Clock className="w-8 h-8 text-[#8B5A3C] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Hours</h3>
                <p className="text-foreground/80 font-medium text-sm">Mon - Fri: 9AM - 6PM</p>
                <p className="text-sm text-foreground/60 mt-2">Sat - Sun: 10AM - 4PM</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 md:py-24 px-4 bg-stone-50">
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-medium text-foreground mb-8 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent disabled:opacity-50"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent disabled:opacity-50"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground font-medium mb-2">Phone</label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      id="contact-country-code"
                      value={countryCode}
                      onChange={setCountryCode}
                      disabled={isLoading}
                      className="w-44 px-3 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent disabled:opacity-50"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent disabled:opacity-50"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent disabled:opacity-50"
                    placeholder="Mattress Inquiry"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  rows={6}
                  className="w-full px-4 py-3 border border-amber-100 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent resize-none disabled:opacity-50"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#8B5A3C] hover:bg-[#6B563F] text-white font-medium py-3 transition-colors disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {isLoading ? "Sending..." : "Send Message"}
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-center font-medium">
                  ✗ {error}
                </div>
              )}

              {submitted && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-center font-medium">
                  ✓ Message sent successfully. Ananthala team will contact soon.
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
