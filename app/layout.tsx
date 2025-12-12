import type React from "react"
import type { Metadata } from "next"
import {
  Caveat,
  Handlee,
  Rock_Salt,
} from "next/font/google"
import { AuthProvider } from "@/components/providers/auth-provider"
import "./globals.css"
import { Toaster } from "sonner"

// Only load fonts that are actually used in the application
// Performance optimization: Reduced from 20+ fonts to 3 essential fonts
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: 'swap' // Improve performance with font-display: swap
})

const handlee = Handlee({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handlee",
  display: 'swap'
})

const rockSalt = Rock_Salt({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rocksalt",
  display: 'swap'
})

export const metadata: Metadata = {
  title: "SoNash - Sober Nashville",
  description: "Your personal recovery notebook for the Nashville community. Track your clean time, journal your thoughts, and stay connected.",
  keywords: ["recovery", "sobriety", "journal", "nashville", "addiction", "sober", "clean time"],
  authors: [{ name: "Jason Bell" }],
  generator: "v0.app",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sonash.app",
    title: "SoNash - Sober Nashville",
    description: "Your personal recovery notebook for the Nashville community.",
    siteName: "SoNash",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoNash - Sober Nashville",
    description: "Your personal recovery notebook for the Nashville community.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`
        font-sans antialiased
        ${caveat.variable}
        ${handlee.variable}
        ${rockSalt.variable}
      `}
      >
        <AuthProvider>
          {children}
          <Toaster closeButton richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
