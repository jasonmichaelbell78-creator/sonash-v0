import type React from "react"
import type { Metadata } from "next"
import {
  Geist,
  Geist_Mono,
  Caveat,
  Kalam,
  Permanent_Marker,
  Architects_Daughter,
  Coming_Soon,
  Handlee,
  Dancing_Script,
  Satisfy,
  Pacifico,
  Amatic_SC,
  Rock_Salt,
  Gloria_Hallelujah,
  Neucha,
  Short_Stack,
  Annie_Use_Your_Telescope,
  Gochi_Hand,
  Pangolin,
  La_Belle_Aurore,
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/providers/auth-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Header fonts
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" })
const kalam = Kalam({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-kalam" })
const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker" })
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" })
const satisfy = Satisfy({ weight: "400", subsets: ["latin"], variable: "--font-satisfy" })
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" })
const amaticSC = Amatic_SC({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-amatic" })
const rockSalt = Rock_Salt({ weight: "400", subsets: ["latin"], variable: "--font-rocksalt" })
const gloriaHallelujah = Gloria_Hallelujah({ weight: "400", subsets: ["latin"], variable: "--font-gloria" })

// Body fonts
const architectsDaughter = Architects_Daughter({ weight: "400", subsets: ["latin"], variable: "--font-architects" })
const comingSoon = Coming_Soon({ weight: "400", subsets: ["latin"], variable: "--font-coming" })
const handlee = Handlee({ weight: "400", subsets: ["latin"], variable: "--font-handlee" })
const neucha = Neucha({ weight: "400", subsets: ["latin"], variable: "--font-neucha" })
const shortStack = Short_Stack({ weight: "400", subsets: ["latin"], variable: "--font-shortstack" })
const annieTelescope = Annie_Use_Your_Telescope({ weight: "400", subsets: ["latin"], variable: "--font-annie" })
const gochiHand = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-gochi" })
const pangolin = Pangolin({ weight: "400", subsets: ["latin"], variable: "--font-pangolin" })
const laBelleAurore = La_Belle_Aurore({ weight: "400", subsets: ["latin"], variable: "--font-labelle" })

export const metadata: Metadata = {
  title: "SoNash - Sober Nashville",
  description: "Your personal recovery notebook for the Nashville community. Track your clean time, journal your thoughts, and stay connected.",
  keywords: ["recovery", "sobriety", "journal", "nashville", "addiction", "sober", "clean time"],
  authors: [{ name: "Jason Bell" }],
  generator: "v0.app",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sonash.vercel.app",
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
        ${kalam.variable}
        ${permanentMarker.variable}
        ${dancingScript.variable}
        ${satisfy.variable}
        ${pacifico.variable}
        ${amaticSC.variable}
        ${rockSalt.variable}
        ${gloriaHallelujah.variable}
        ${architectsDaughter.variable}
        ${comingSoon.variable}
        ${handlee.variable}
        ${neucha.variable}
        ${shortStack.variable}
        ${annieTelescope.variable}
        ${gochiHand.variable}
        ${pangolin.variable}
        ${laBelleAurore.variable}
      `}
      >
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
