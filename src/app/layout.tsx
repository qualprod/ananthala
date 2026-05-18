import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/contexts/cart-context"
import { CartSyncWrapper } from "@/components/cart/cart-sync-wrapper"
import { FixedSidebar } from "@/components/layout/fixed-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ClarityAnalytics } from "@/components/clarity-analytics"

// @ts-ignore
import "./globals.css"

const cormorantGaramond = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#8B5A3C",
}

export const metadata: Metadata = {
  title: "ANANTHALA -Crafted for comfort naturally",
  description:
    "Premium mattresses crafted for your best sleep. Experience luxury comfort with our 100-night trial and 15-year warranty.",
  keywords: "mattresses, premium sleep, luxury bedding, better sleep, 100-night trial",
  openGraph: {
    title: "ANANTHALA - Premium Mattresses for Better Sleep",
    description: "Premium mattresses crafted for your best sleep.",
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cormorantGaramond.className} antialiased`} style={{ fontWeight: 300 }}>
        <CartProvider>
          <CartSyncWrapper>
            {children}
            <FixedSidebar />
          </CartSyncWrapper>
        </CartProvider>
        <Toaster />
        <Analytics />
        <ClarityAnalytics />
      </body>
    </html>
  )
}
