"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion"
import { Moon, Save, ChevronRight, ChevronLeft, Check } from "lucide-react"
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
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { Mic, MicOff } from "lucide-react"
import { toast } from "sonner"

type NightReviewCardProps = HTMLMotionProps<"button">

// --- CONSTANTS ---

const ACTIONS = [
    { id: 'prayer', label: 'Morning Prayer/Meditation' },
    { id: 'reading', label: 'Read Scripture/Recovery Lit' },
    { id: 'meeting', label: 'Attended a Meeting' },
    { id: 'sponsor', label: 'Called my Sponsor' },
]

const TRAIT_PAIRS = [
    { id: 'anger_calm', left: 'Anger', right: 'Calm' },
    { id: 'dishonest_honest', left: 'Dishonest', right: 'Honest' },
    { id: 'doubt_faith', left: 'Doubt', right: 'Faith' },
    { id: 'envy_content', left: 'Envy', right: 'Content' },
    { id: 'fear_courage', left: 'Fear', right: 'Courage' },
    { id: 'gluttony_moderate', left: 'Gluttony', right: 'Moderate' },
    { id: 'grandiose_modest', left: 'Grandiose', right: 'Modest' },
    { id: 'greed_giving', left: 'Greed', right: 'Giving' },
    { id: 'harmful_helpful', left: 'Harmful', right: 'Helpful' },
    { id: 'hate_love', left: 'Hate', right: 'Love' },
    { id: 'impatient_patient', left: 'Impatient', right: 'Patient' },
    { id: 'inconsiderate_considerate', left: 'Inconsiderate', right: 'Considerate' },
    { id: 'intolerant_tolerant', left: 'Intolerant', right: 'Tolerant' },
    { id: 'jealous_confident', left: 'Jealous', right: 'Confident' },
    { id: 'lazy_productive', left: 'Lazy', right: 'Productive' },
    { id: 'lust_chaste', left: 'Lust', right: 'Chaste' },
    { id: 'pride_humble', left: 'Pride', right: 'Humble' },
    { id: 'procrastinate_motivated', left: 'Procrastinate', right: 'Motivated' },
    { id: 'resentful_forgiving', left: 'Resentful', right: 'Forgiving' },
    { id: 'self_condemn_self_accept', left: 'Self-Condemn', right: 'Self-accept' },
    { id: 'self_justified_humble', left: 'Self-Justified', right: 'Humble' },
    { id: 'self_pity_self_forgive', left: 'Self-pity', right: 'Self-Forgive' },
    { id: 'self_seeking_selfless', left: 'Self-Seeking', right: 'Selfless' },
    { id: 'suspicious_trust', left: 'Suspicious', right: 'Trust' },
    { id: 'unfaithful_faithful', left: 'Unfaithful', right: 'Faithful' },
]

const REFLECTIONS = [
    { id: 'resentful', label: 'Resentful?' },
    { id: 'selfish', label: 'Selfish?' },
    { id: 'dishonest', label: 'Dishonest?' },
    { id: 'afraid', label: 'Afraid?' },
    { id: 'secrets', label: 'What secrets am I keeping?' },
    { id: 'discuss', label: 'Who will I tell?' },
    { id: 'others', label: 'Was I thinking of myself or what I could do for others?' },
    { id: 'kind', label: 'Was I kind and loving toward all?' },
    { id: 'better', label: 'What could I have done better?' },
    { id: 'harm', label: 'Did I cause any harm?' },
    { id: 'apology', label: 'To whom do I owe an apology?' },
]

export default function NightReviewCard({ className, ...props }: NightReviewCardProps) {
    const [open, setOpen] = useState(false) // Was isOpen, changed to open to match Dialog usage typical patterns if needed, but keeping isOpen internal variable name consistent. Wait, previous code used isOpen. Dialog expects 'open'.
    // Let's stick to 'open' state variable name if passed to Dialog open={open}

    // Actually previous code: const [isOpen, setIsOpen] = useState(false). passed to Dialog open={open}. Wait, line 75 says `const [isOpen, setIsOpen] = useState(false)`. Line 270 says `Dialog open={open}` in my replace block, but previous `Dialog open={open}` in line 270.
    // I need to be careful. The previous code passed `open={open}` in my replacement block step 1074. But defined `isOpen` in line 75. 
    // I will use `open` and `setOpen` for consistency.

    const [step, setStep] = useState(1)
    const [isSaving, setIsSaving] = useState(false)
    const { user } = useAuth()

    // Form State
    const [actions, setActions] = useState<Record<string, boolean>>({})
    const [traits, setTraits] = useState<Record<string, 'negative' | 'positive' | null>>({})
    const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({})
    const [gratitude, setGratitude] = useState("")
    const [surrender, setSurrender] = useState("")

    // Speech Recognition
    const { isListening, transcript, startListening, stopListening, hasSupport } = useSpeechRecognition()
    const [activeSpeechField, setActiveSpeechField] = useState<string | null>(null)
    const textBeforeSpeakingRef = useRef<string>("")

    // Helper functions
    const setTrait = (id: string, value: 'positive' | 'negative') => {
        setTraits(prev => ({ ...prev, [id]: value }))
    }

    const toggleSpeech = (fieldId: string, currentText: string) => {
        if (isListening && activeSpeechField === fieldId) {
            stopListening()
            setActiveSpeechField(null)
        } else {
            if (isListening) stopListening() // Stop active
            setActiveSpeechField(fieldId)
            textBeforeSpeakingRef.current = currentText
            startListening()
        }
    }

    // Sync transcript to active field
    useEffect(() => {
        if (!activeSpeechField || !transcript) return

        const newText = textBeforeSpeakingRef.current
            ? `${textBeforeSpeakingRef.current} ${transcript}`
            : transcript

        if (activeSpeechField === 'gratitude') {
            setGratitude(newText)
        } else if (activeSpeechField === 'surrender') {
            setSurrender(newText)
        } else if (REFLECTIONS.some(r => r.id === activeSpeechField)) {
            setReflectionAnswers(prev => ({
                ...prev,
                [activeSpeechField]: newText
            }))
        }
    }, [transcript, activeSpeechField])

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4))
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

    const handleSave = async () => {
        if (!user) return
        setIsSaving(true)
        try {
            // Save to inventory entries (existing)
            await FirestoreService.saveInventoryEntry(user.uid, {
                type: 'night-review',
                data: {
                    step1_actions: actions,
                    step2_traits: traits,
                    step3_reflections: reflectionAnswers,
                    step4_gratitude: gratitude,
                    step4_surrender: surrender,
                    timestamp: new Date()
                }
            })

            // Also save to journal collection for timeline display
            await FirestoreService.saveNotebookJournalEntry(user.uid, {
                type: 'night-review',
                data: {
                    actions,
                    traits,
                    reflections: reflectionAnswers,
                    gratitude,
                    surrender
                }
            })

            toast.success("Night Review saved.")
            setOpen(false)
            // Reset form? Optional.
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Failed to save.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`col-span-1 bg-white p-4 rounded-xl border border-amber-900/10 shadow-sm flex flex-col items-start gap-3 relative overflow-hidden group text-left ${className}`}
                    {...props}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Moon className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                        <Moon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-heading text-amber-900">Nightly Inventory</h3>
                        <p className="font-body text-xs text-amber-900/60 leading-tight mt-1">
                            Review, reset, and rest well.
                        </p>
                    </div>
                </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-indigo-950 border-indigo-800 text-indigo-100 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 pb-2 shrink-0 bg-indigo-950/50">
                    <DialogTitle className="text-xl font-bold text-indigo-50 flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-400" />
                        Nightly Inventory
                    </DialogTitle>
                    <DialogDescription className="text-indigo-300">
                        Review your day, reset, and rest.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pl-6 pr-8">
                    <div className="pb-6">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Actions (Reverted to Checklist) */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-100">The Action</h3>
                                        <p className="text-sm text-slate-400">What did I do for my recovery today?</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {ACTIONS.map(action => (
                                            <button
                                                key={action.id}
                                                onClick={() => setActions(prev => ({ ...prev, [action.id]: !prev[action.id] }))}
                                                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${actions[action.id]
                                                    ? "bg-indigo-500/10 border-indigo-500/50"
                                                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                                                    }`}
                                            >
                                                <span className={`font-medium transition-colors ${actions[action.id] ? "text-indigo-200" : "text-slate-300 group-hover:text-slate-200"}`}>
                                                    {action.label}
                                                </span>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${actions[action.id]
                                                    ? "bg-indigo-500 border-indigo-500 text-white"
                                                    : "border-slate-600 group-hover:border-slate-500"
                                                    }`}>
                                                    {actions[action.id] && <Check className="w-4 h-4" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: The Mirror (Traits) */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-100">The Mirror</h3>
                                        <p className="text-sm text-slate-400">Which side of the coin did I fall on?</p>
                                    </div>

                                    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                                        {/* Header */}
                                        <div className="grid grid-cols-2 bg-slate-900">
                                            <div className="p-3 text-center border-r border-slate-800">
                                                <span className="font-bold text-slate-200 uppercase tracking-wider text-xs md:text-sm">SELF-WILL</span>
                                            </div>
                                            <div className="p-3 text-center">
                                                <span className="font-bold text-slate-200 uppercase tracking-wider text-xs md:text-sm">SPIRIT-WILL</span>
                                            </div>
                                        </div>

                                        {/* Rows */}
                                        {TRAIT_PAIRS.map((pair, index) => (
                                            <div key={pair.id} className="grid grid-cols-2 border-t border-slate-800">
                                                {/* Left Column Item (Negative) */}
                                                <div className={`p-2 flex items-center justify-between border-r border-slate-800 ${index % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                                                    <span className="text-sm text-slate-300 ml-2">{pair.left}</span>
                                                    <button
                                                        onClick={() => setTrait(pair.id, 'negative')}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-2 ${traits[pair.id] === 'negative'
                                                            ? "bg-red-500 border-red-500 text-white"
                                                            : "bg-slate-800/50 border-slate-600 hover:border-slate-500"
                                                            }`}
                                                    >
                                                        {traits[pair.id] === 'negative' && <Check className="w-3 h-3" />}
                                                    </button>
                                                </div>

                                                {/* Right Column Item (Positive) */}
                                                <div className={`p-2 flex items-center gap-2 ${index % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                                                    <button
                                                        onClick={() => setTrait(pair.id, 'positive')}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ml-2 shrink-0 ${traits[pair.id] === 'positive'
                                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                                            : "bg-slate-800/50 border-slate-600 hover:border-slate-500"
                                                            }`}
                                                    >
                                                        {traits[pair.id] === 'positive' && <Check className="w-3 h-3" />}
                                                    </button>
                                                    <span className="text-sm text-slate-300">{pair.right}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Reflections */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 pb-4"
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-100">Deep Dive</h3>
                                        <p className="text-sm text-slate-400">Review the day constructively. Where were you?</p>
                                    </div>
                                    <div className="space-y-4">
                                        {REFLECTIONS.map(item => (
                                            <div key={item.id} className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-medium text-indigo-200">{item.label}</label>
                                                    {hasSupport && (
                                                        <button
                                                            onClick={() => toggleSpeech(item.id, reflectionAnswers[item.id] || "")}
                                                            className={`p-1.5 rounded-full transition-colors ${activeSpeechField === item.id && isListening
                                                                ? "bg-red-500/20 text-red-400 animate-pulse"
                                                                : "bg-slate-800 text-slate-400 hover:text-indigo-300"
                                                                }`}
                                                        >
                                                            {activeSpeechField === item.id && isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                                <textarea
                                                    value={reflectionAnswers[item.id] || ""}
                                                    onChange={(e) => setReflectionAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    rows={2}
                                                    className={`w-full bg-slate-900/50 border rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors ${activeSpeechField === item.id ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : "border-slate-800"}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Closing */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-slate-100">Closing</h3>
                                            <p className="text-sm text-slate-400">Surrender the day.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-emerald-200">Today I am grateful for...</label>
                                                {hasSupport && (
                                                    <button
                                                        onClick={() => toggleSpeech('gratitude', gratitude)}
                                                        className={`p-1.5 rounded-full transition-colors ${activeSpeechField === 'gratitude' && isListening
                                                            ? "bg-red-500/20 text-red-400 animate-pulse"
                                                            : "bg-slate-800 text-slate-400 hover:text-emerald-300"
                                                            }`}
                                                    >
                                                        {activeSpeechField === 'gratitude' && isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                value={gratitude}
                                                onChange={(e) => setGratitude(e.target.value)}
                                                rows={3}
                                                className={`w-full bg-slate-900/50 border rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none ${activeSpeechField === 'gratitude' ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-slate-800"}`}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-indigo-200">Today I accept/surrender...</label>
                                                {hasSupport && (
                                                    <button
                                                        onClick={() => toggleSpeech('surrender', surrender)}
                                                        className={`p-1.5 rounded-full transition-colors ${activeSpeechField === 'surrender' && isListening
                                                            ? "bg-red-500/20 text-red-400 animate-pulse"
                                                            : "bg-slate-800 text-slate-400 hover:text-indigo-300"
                                                            }`}
                                                    >
                                                        {activeSpeechField === 'surrender' && isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                value={surrender}
                                                onChange={(e) => setSurrender(e.target.value)}
                                                rows={3}
                                                className={`w-full bg-slate-900/50 border rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none ${activeSpeechField === 'surrender' ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : "border-slate-800"}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-indigo-950/40 border border-indigo-500/20 rounded-xl space-y-4 text-center">
                                        <h4 className="font-handlee text-xl text-indigo-300">10th Step Amends Prayer</h4>
                                        <p className="text-sm text-indigo-100/90 italic leading-relaxed font-serif">
                                            "Please forgive me for my failings today. I know that because of my failings, I was not able to be as effective as I could have been for you. Please forgive me and help me live your will better today.
                                            <br /><br />
                                            I ask you now to show me how to correct the errors I have just outlined. Guide me and direct me. Please remove my arrogance and my fear. Show me how to make my relationships right and grant me the humility and strength to do your will." (86:1)
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-indigo-950 border-t border-indigo-800 px-6 py-4 flex justify-between shrink-0">
                    <Button
                        variant="ghost"
                        onClick={step === 1 ? () => setOpen(false) : prevStep}
                        className="text-indigo-400 hover:text-indigo-200 hover:bg-indigo-900/50"
                    >
                        {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-2" /> Back</>}
                    </Button>

                    <div className="flex gap-2">
                        {step === 4 && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // Build share text with null checks
                                    const actionsList = Object.entries(actions)
                                        .filter(([_, v]) => v)
                                        .map(([k]) => ACTIONS.find(a => a.id === k)?.label)
                                        .filter(Boolean)
                                        .join(", ") || "None"

                                    const traitsList = Object.entries(traits)
                                        .filter(([_, v]) => v !== null)
                                        .map(([k, v]) => {
                                            const pair = TRAIT_PAIRS.find(p => p.id === k)
                                            return pair ? `${pair.left}/${pair.right}: ${v}` : null
                                        })
                                        .filter(Boolean)
                                        .join(", ") || "None"

                                    const reflectionsList = Object.values(reflectionAnswers)
                                        .filter(v => v && v.trim())
                                        .join("\n") || "None"

                                    const shareText = `Nightly Inventory\n\nActions: ${actionsList}\n\nTraits: ${traitsList}\n\nReflections: ${reflectionsList}\n\nGratitude: ${gratitude || "None"}\n\nSurrender: ${surrender || "None"}`

                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Nightly Inventory',
                                            text: shareText
                                        }).catch(console.error)
                                    } else {
                                        // Fallback to mailto
                                        window.open(`mailto:?subject=Nightly Inventory&body=${encodeURIComponent(shareText)}`)
                                    }
                                }}
                                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-200"
                            >
                                Share
                            </Button>
                        )}
                        <Button
                            onClick={step === 4 ? handleSave : nextStep}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[100px]"
                        >
                            {isSaving ? (
                                <span className="animate-spin">⌛</span>
                            ) : step === 4 ? (
                                <><Save className="w-4 h-4 mr-2" /> Finish</>
                            ) : (
                                <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
