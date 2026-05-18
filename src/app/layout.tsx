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
  title: "ANANTHALA - Crafted for comfort naturally",
  description:
    "ANANTHALA crafts virgin cotton sleep products rooted in heritage. Naati cotton, no synthetics—crafted for comfort, naturally. 100-night trial and 15-year warranty.",
  keywords:
    "ANANTHALA, virgin cotton bedding, natural sleep products, Naati cotton, organic sleep products, baby sleep products, sustainable bedding, chemical-free bedding, natural comfort, heritage craftsmanship, cotton bedding, baby lounger, 100-night trial",
  openGraph: {
    title: "ANANTHALA - Crafted for comfort naturally",
    description:
      "Virgin cotton sleep products—heritage craftsmanship, Naati cotton, and comfort without synthetics.",
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
