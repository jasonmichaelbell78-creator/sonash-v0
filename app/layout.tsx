import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import Script from "next/script"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ErrorBoundary } from "@/components/providers/error-boundary"
import { CelebrationProvider } from "@/components/celebrations/celebration-provider"
import "./globals.css"
import { Toaster } from "sonner"

// Self-hosted fonts using @fontsource packages
// Avoids network dependency on fonts.googleapis.com during builds
// Performance optimization: Reduced from 20+ fonts to 2 essential fonts
const handlee = localFont({
  src: "../node_modules/@fontsource/handlee/files/handlee-latin-400-normal.woff2",
  variable: "--font-handlee",
  display: 'swap',
  weight: '400',
})

const rockSalt = localFont({
  src: "../node_modules/@fontsource/rock-salt/files/rock-salt-latin-400-normal.woff2",
  variable: "--font-rocksalt",
  display: 'swap',
  weight: '400',
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
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
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
        {/* Load reCAPTCHA Enterprise for bot protection */}
        <Script
          src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY}`}
          strategy="lazyOnload"
        />
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
