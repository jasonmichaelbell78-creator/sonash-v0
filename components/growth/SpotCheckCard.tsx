"use client"

import { useState, useRef, useEffect } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { Zap, X, ChevronRight, Check } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { toast } from "sonner"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { Mic, MicOff } from "lucide-react"

type SpotCheckCardProps = HTMLMotionProps<"button">

export default function SpotCheckCard({ className, ...props }: SpotCheckCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
    const [absolutes, setAbsolutes] = useState<string[]>([])
    const [action, setAction] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const { user } = useAuth()

    // Speech
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition()
    const textBeforeSpeakingRef = useRef<string>("")

    const toggleSpeech = () => {
        if (isListening) {
            stopListening()
            resetTranscript()
        } else {
            textBeforeSpeakingRef.current = action
            resetTranscript()
            startListening()
        }
    }

    useEffect(() => {
        if (!isListening) return
        const newText = textBeforeSpeakingRef.current
            ? (transcript ? `${textBeforeSpeakingRef.current} ${transcript}` : textBeforeSpeakingRef.current)
            : transcript
        setAction(newText)
    }, [transcript, isListening])

    const handleSave = async () => {
        if (!user) return

        setIsSaving(true)
        try {
            // Save to inventory entries (existing)
            await FirestoreService.saveInventoryEntry(user.uid, {
                type: "spot-check",
                data: {
                    feelings: selectedFeelings,
                    absolutes: absolutes,
                    action: action
                },
                tags: [...selectedFeelings, ...absolutes]
            })

            // Also save to journal collection for timeline display
            await FirestoreService.saveNotebookJournalEntry(user.uid, {
                type: 'spot-check',
                data: {
                    feelings: selectedFeelings,
                    absolutes: absolutes,
                    action: action
                }
            })

            setIsOpen(false)
            // Optional: Toast success
        } catch (error) {
            console.error("Failed to save spot check", error)
        } finally {
            setIsSaving(false)
        }
    }

    const toggleFeeling = (feeling: string) => {
        setSelectedFeelings(prev =>
            prev.includes(feeling)
                ? prev.filter(f => f !== feeling)
                : [...prev, feeling]
        )
    }

    const toggleAbsolute = (abs: string) => {
        setAbsolutes(prev =>
            prev.includes(abs)
                ? prev.filter(a => a !== abs)
                : [...prev, abs]
        )
    }

    // Reset wizard when closing
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        setIsOpen(open)
        if (!open) {
            setTimeout(() => {
                setStep(1)
                setSelectedFeelings([]) // Reset feelings
                setAbsolutes([])
                setAction("")
            }, 300)
        }
    }

    const FEELINGS = [
        "Resentful", "Fearful", "Selfish", "Dishonest", // The 4 Absolutes
        "Angry", "Hungry", "Lonely", "Tired", // HALT
        "Overwhelmed", "Sad", "Ashamed", "Confused"
    ]

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`col-span-1 bg-white p-4 rounded-xl border border-amber-900/10 shadow-sm flex flex-col items-start gap-3 relative overflow-hidden group text-left ${className}`}
                    {...props}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-heading text-amber-900">Spot Check</h3>
                        <p className="font-body text-xs text-amber-900/60 leading-tight mt-1">
                            Agitated? Pause and check exactly why.
                        </p>
                    </div>
                </motion.button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] bg-[#fbf9f5] border-amber-100 p-0 overflow-hidden text-amber-900">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="font-handlee text-2xl text-amber-900 flex items-center gap-2">
                        <span className="p-1.5 bg-amber-100 rounded-md"><Zap className="w-4 h-4 text-amber-600" /></span>
                        Spot Check
                    </DialogTitle>
                    <DialogDescription className="text-amber-900/60">
                        Quickly process agitation or negative feelings.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-lg font-medium">What's disturbing you?</p>
                            {/* Feelings selection will go here */}
                            <div className="grid grid-cols-2 gap-2">
                                {FEELINGS.map((feeling) => (
                                    <button
                                        key={feeling}
                                        onClick={() => toggleFeeling(feeling)}
                                        className={`
                                            p-3 rounded-lg text-sm font-medium transition-all duration-200 border
                                            ${selectedFeelings.includes(feeling)
                                                ? "bg-amber-200 border-amber-400 text-amber-900 shadow-inner"
                                                : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                                            }
                                        `}
                                    >
                                        {feeling}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-lg font-medium">Nature of the Wrong</p>
                            <p className="text-sm text-amber-900/60 -mt-3 relative">Where was I...</p>

                            <div className="grid grid-cols-1 gap-2">
                                {["Selfish", "Dishonest", "Self-seeking", "Frightened"].map((abs) => (
                                    <button
                                        key={abs}
                                        onClick={() => toggleAbsolute(abs)}
                                        className={`
                                            w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border flex justify-between items-center
                                            ${absolutes.includes(abs)
                                                ? "bg-red-50 border-red-200 text-red-900 shadow-sm"
                                                : "bg-white border-amber-100 text-amber-900/70 hover:bg-amber-50"
                                            }
                                        `}
                                    >
                                        <span>{abs}</span>
                                        {absolutes.includes(abs) && <Check className="w-5 h-5 text-red-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-medium">Turn it over</p>
                                {hasSupport && (
                                    <button
                                        onClick={toggleSpeech}
                                        className={`p-2 rounded-full transition-colors ${isListening
                                            ? "bg-red-500/20 text-red-400 animate-pulse"
                                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                            }`}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-amber-900/60 -mt-3">What is the next right action?</p>

                            <textarea
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                placeholder="I need to apologize to... I need to sit quietly..."
                                className="w-full h-40 p-4 rounded-xl border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-amber-900 resize-none placeholder:text-amber-900/30"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <div className="bg-amber-100/50 px-6 py-4 flex justify-between items-center">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-amber-800 hover:text-amber-900 hover:bg-amber-200/50">
                            Back
                        </Button>
                    ) : (
                        <span /> // Spacer
                    )}

                    <Button
                        onClick={() => step < 3 ? setStep(step + 1) : handleSave()}
                        disabled={isSaving}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-handlee"
                    >
                        {isSaving ? "Saving..." : (step < 3 ? (
                            <>Next <ChevronRight className="ml-1 w-4 h-4" /></>
                        ) : (
                            <>Finish <Check className="ml-1 w-4 h-4" /></>
                        ))}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
