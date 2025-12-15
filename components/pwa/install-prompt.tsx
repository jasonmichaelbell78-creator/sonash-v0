"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches

        if (isIosDevice && !isStandalone) {
            setIsIOS(true)
            // Delay showing it slightly so they see the app first
            setTimeout(() => setIsVisible(true), 3000)
        }

        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            // Update UI notify the user they can install the PWA
            setIsVisible(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install promise: ${outcome}`)

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 200, opacity: 0, rotate: 5 }}
                animate={{ y: 0, opacity: 1, rotate: -2 }}
                exit={{ y: 200, opacity: 0 }}
                className="fixed bottom-6 right-6 z-50 max-w-[280px]"
            >
                <div
                    className="bg-[#fefce8] p-4 shadow-[2px_4px_8px_rgba(0,0,0,0.15)] transform rotate-[-2deg] border border-amber-100"
                    style={{ fontFamily: 'var(--font-handlee), sans-serif' }}
                >
                    {/* Tape effect */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/40 rotate-[2deg] backdrop-blur-[1px] shadow-sm transform skew-x-12" />

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-1 right-1 text-amber-900/40 hover:text-amber-900"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                        {isIOS ? (
                            <>
                                <Download className="w-5 h-5 rotate-180" />
                                Install on iPhone
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Install App?
                            </>
                        )}
                    </h3>

                    <p className="text-amber-800 text-sm mb-3 leading-tight">
                        {isIOS
                            ? "Tap the 'Share' button below, then scroll down and 'Add to Home Screen'."
                            : "Install SoNash to your home screen for quick access offline!"}
                    </p>

                    {!isIOS && (
                        <button
                            onClick={handleInstallClick}
                            className="w-full bg-amber-200/50 hover:bg-amber-300/50 text-amber-900 font-bold py-2 rounded border border-amber-300/50 transition-colors"
                        >
                            Yes, Install It!
                        </button>
                    )}

                    {isIOS && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-amber-800 border-r-[10px] border-r-transparent"></div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
