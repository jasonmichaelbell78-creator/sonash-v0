import type React from "react"
import type { Metadata } from "next"
import {
  Handlee,
  Rock_Salt,
} from "next/font/google"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ErrorBoundary } from "@/components/providers/error-boundary"
import { CelebrationProvider } from "@/components/celebrations/celebration-provider"
import "./globals.css"
import { Toaster } from "sonner"

// Only load fonts that are actually used in the application
// Performance optimization: Reduced from 20+ fonts to 2 essential fonts
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

import type { Viewport } from "next"
import { InstallPrompt } from "@/components/pwa/install-prompt"

export const viewport: Viewport = {
  themeColor: "#f5f0e6",
  width: "device-width",
  initialScale: 1,
  // Removed maximumScale and userScalable restrictions to comply with WCAG 2.1 (1.4.4)
  // Users with visual impairments must be able to zoom the interface
}

// ... existing metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        suppressHydrationWarning
        className={`
        font-sans antialiased
        ${handlee.variable}
        ${rockSalt.variable}
      `}
      >
        <ErrorBoundary>
          <AuthProvider>
            <CelebrationProvider>
              {children}
              <InstallPrompt />
              <Toaster closeButton richColors />
            </CelebrationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
