"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    onresult: (event: SpeechRecognitionEvent) => void
    onend: () => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition
}

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
        const WindowWithSpeech = window as Window & {
            SpeechRecognition?: SpeechRecognitionConstructor
            webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
        const SpeechRecognition = WindowWithSpeech.SpeechRecognition || WindowWithSpeech.webkitSpeechRecognition
        return !!SpeechRecognition
    })

    // Use a ref to keep track of the recognition instance
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined" && hasSupport) {
            const WindowWithSpeech = window as Window & {
                SpeechRecognition?: SpeechRecognitionConstructor
                webkitSpeechRecognition?: SpeechRecognitionConstructor
            }
            const SpeechRecognition = WindowWithSpeech.SpeechRecognition || WindowWithSpeech.webkitSpeechRecognition
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
    }, [hasSupport])

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
