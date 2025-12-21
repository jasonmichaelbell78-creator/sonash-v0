/// <reference path="../../web-speech-api.d.ts" />
"use client"

import * as React from "react"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface VoiceTextAreaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onTranscript?: (text: string) => void
}

export const VoiceTextArea = React.forwardRef<HTMLTextAreaElement, VoiceTextAreaProps>(
    ({ className, onTranscript: _onTranscript, onChange, value, ...props }, ref) => {
        const [isListening, setIsListening] = React.useState(false)
        const [isSupported, setIsSupported] = React.useState(true)
        const recognitionRef = React.useRef<SpeechRecognition | null>(null)

        React.useEffect(() => {
            // Check for browser support
            if (typeof window !== "undefined") {
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

                    recognition.onstart = () => setIsListening(true)

                    recognition.onend = () => setIsListening(false)

                    recognition.onresult = (event: SpeechRecognitionEvent) => {
                        let finalTranscript = ""

                        // Build transcript from results
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) {
                                finalTranscript += event.results[i][0].transcript + " "
                            }
                        }

                        if (finalTranscript && onChange) {
                            // Append to existing value
                            // We construct a synthetic event to play nice with React forms
                            const newValue = (value || "") + finalTranscript
                            const syntheticEvent = {
                                target: { value: newValue }
                            } as React.ChangeEvent<HTMLTextAreaElement>

                            onChange(syntheticEvent)
                        }
                    }

                    recognitionRef.current = recognition
                } else {
                    setIsSupported(false)
                }
            }
        }, [onChange, value])

        const toggleListening = (e: React.MouseEvent) => {
            e.preventDefault()
            if (!recognitionRef.current) return

            if (isListening) {
                recognitionRef.current.stop()
            } else {
                recognitionRef.current.start()
            }
        }

        return (
            <div className="relative">
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10",
                        isListening && "ring-2 ring-red-400 border-red-400 bg-red-50/10",
                        className
                    )}
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                {isSupported && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={cn(
                            "absolute right-2 top-2 p-2 rounded-full transition-all hover:bg-muted",
                            isListening ? "text-red-500 animate-pulse bg-red-100" : "text-muted-foreground"
                        )}
                        title={isListening ? "Stop recording" : "Start voice input"}
                    >
                        {isListening ? (
                            <Mic className="h-4 w-4" />
                        ) : (
                            <MicOff className="h-4 w-4 opacity-50 hover:opacity-100" />
                        )}
                    </button>
                )}
            </div>
        )
    }
)
VoiceTextArea.displayName = "VoiceTextArea"
