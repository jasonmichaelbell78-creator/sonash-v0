"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

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
    const [hasSupport, setHasSupport] = useState(false)

    // Use a ref to keep track of the recognition instance
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                setHasSupport(true)
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = "en-US"

                recognition.onresult = (event: any) => {
                    let currentTranscript = ""
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPart = event.results[i][0].transcript
                        if (event.results[i].isFinal) {
                            setTranscript((prev) => prev ? `${prev} ${transcriptPart}` : transcriptPart)
                        } else {
                            currentTranscript += transcriptPart
                        }
                    }
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error)
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
    }, [])

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (error) {
                console.error("Failed to start speech recognition", error)
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
