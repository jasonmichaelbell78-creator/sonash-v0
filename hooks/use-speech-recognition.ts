"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

interface UseSpeechRecognitionReturn {
    isListening: boolean
    transcript: string
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
    hasSupport: boolean
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    // Detect speech recognition support during state initialization
    const [hasSupport] = useState(() => {
        if (typeof window === "undefined") return false
        const win = window as typeof window & {
            SpeechRecognition?: SpeechRecognitionConstructor
            webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
        const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition
        return !!SpeechRecognition
    })

    // Use a ref to keep track of the recognition instance
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined" && hasSupport) {
            const win = window as typeof window & {
                SpeechRecognition?: SpeechRecognitionConstructor
                webkitSpeechRecognition?: SpeechRecognitionConstructor
            }
            const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = "en-US"

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPart = event.results[i][0].transcript
                        if (event.results[i].isFinal) {
                            setTranscript((prev) => prev ? `${prev} ${transcriptPart}` : transcriptPart)
                        }
                    }
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    logger.error("Speech recognition error", { error: event.error })
                    if (event.error === 'no-speech') {
                        // silently handle no-speech by just stopping, user can toggle again. 
                        // Or warn them? "No speech detected. Try again."
                        // toast.info("No speech detected. Please try again.") 
                    } else {
                        toast.error(`Speech recognition error: ${event.error}`)
                    }
                    setIsListening(false)
                }

                recognitionRef.current = recognition
            }
        }
    }, [hasSupport])

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (error) {
                logger.error("Failed to start speech recognition", { error })
            }
        }
    }, [isListening])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [isListening])

    const resetTranscript = useCallback(() => {
        setTranscript("")
    }, [])

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        hasSupport
    }
}
