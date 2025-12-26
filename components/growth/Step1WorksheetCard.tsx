"use client"

import { useState, useMemo } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { BookOpen, ChevronLeft, ChevronRight, Save } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

type Step1WorksheetCardProps = HTMLMotionProps<"button">

interface Step1Data {
    // Concept 1: Powerlessness over Amount
    concept1_q1_examples: string[]
    concept1_q1_results: string[]
    concept1_q2_examples: string[]
    concept1_q2_results: string[]
    concept1_q3_examples: string[]
    concept1_q3_results: string[]
    concept1_q4_examples: string[]
    concept1_q4_results: string[]
    concept1_q5: string[]

    // Concept 2: Powerlessness over Bad Results
    concept2_q1_examples: string[]
    concept2_q1_results: string[]
    concept2_q2_examples: string[]
    concept2_q2_results: string[]
    concept2_q3_examples: string[]
    concept2_q3_results: string[]

    // Concept 3: Unmanageability
    concept3_q1: string[]
    concept3_q2: string[]
    concept3_q3: string[]
    concept3_q4: string[]
    concept3_q5: string[]
    concept3_q6: string[]
    concept3_q7: string[]
    concept3_q8: string[]
    concept3_q9: string[]
    concept3_q10: string[]
    concept3_q11: string[]
    concept3_q12: string[]
    concept3_q13: string[]
    concept3_q14: string[]

    // Conclusions
    conclusion_q1: string[]
    conclusion_q2: string
    conclusion_q3: string
    conclusion_q4: string[]
}

interface QuestionConfig {
    id: string
    label: string
    description?: string
    type: 'dual-textarea' | 'single-textarea' | 'long-textarea' | 'multi-textarea'
    examplesField?: keyof Step1Data
    resultsField?: keyof Step1Data
    singleField?: keyof Step1Data
    count?: number
}

interface SectionConfig {
    title: string
    subtitle?: string
    bgColor: string
    borderColor: string
    textColor: string
    questions: QuestionConfig[]
}

const initialData: Step1Data = {
    concept1_q1_examples: ['', '', ''],
    concept1_q1_results: ['', '', ''],
    concept1_q2_examples: ['', '', ''],
    concept1_q2_results: ['', '', ''],
    concept1_q3_examples: ['', '', ''],
    concept1_q3_results: ['', '', ''],
    concept1_q4_examples: ['', '', ''],
    concept1_q4_results: ['', '', ''],
    concept1_q5: ['', '', ''],

    concept2_q1_examples: ['', '', ''],
    concept2_q1_results: ['', '', ''],
    concept2_q2_examples: ['', '', ''],
    concept2_q2_results: ['', '', ''],
    concept2_q3_examples: ['', '', ''],
    concept2_q3_results: ['', '', ''],

    concept3_q1: ['', '', ''],
    concept3_q2: ['', '', ''],
    concept3_q3: ['', '', ''],
    concept3_q4: ['', '', ''],
    concept3_q5: ['', '', ''],
    concept3_q6: ['', '', ''],
    concept3_q7: ['', '', ''],
    concept3_q8: ['', '', ''],
    concept3_q9: ['', '', ''],
    concept3_q10: ['', '', ''],
    concept3_q11: ['', '', ''],
    concept3_q12: ['', '', ''],
    concept3_q13: ['', '', ''],
    concept3_q14: ['', '', ''],

    conclusion_q1: ['', '', ''],
    conclusion_q2: '',
    conclusion_q3: '',
    conclusion_q4: Array(15).fill(''),
}

const FORM_SECTIONS: SectionConfig[] = [
    {
        title: "Concept 1: POWERLESSNESS over AMOUNT of Alcohol Consumed",
        bgColor: "bg-red-50",
        borderColor: "border-red-400",
        textColor: "text-red-900",
        questions: [
            {
                id: "concept1_q1",
                label: "1.1 Have you ever tried to stop drinking/drugging completely? Give examples:",
                type: "dual-textarea",
                examplesField: "concept1_q1_examples",
                resultsField: "concept1_q1_results",
            },
            {
                id: "concept1_q2",
                label: "1.2 Have you ever tried to limit or control the amount of alcohol or drugs you used by limiting dosage?",
                description: "(for instance, promising yourself or someone else you would have only 2 drinks at a party)",
                type: "dual-textarea",
                examplesField: "concept1_q2_examples",
                resultsField: "concept1_q2_results",
            },
            {
                id: "concept1_q3",
                label: "1.3 Give examples of how you tried to limit or control the amount of alcohol or drugs you used by switching drinks",
                description: "(for instance, switched from straight liquor to a mixed drink or beer, or switched to a drink you do not like)",
                type: "dual-textarea",
                examplesField: "concept1_q3_examples",
                resultsField: "concept1_q3_results",
            },
            {
                id: "concept1_q4",
                label: "1.4 Give examples of how you tried to limit or control the amount of alcohol or drugs you used by limiting the time for drinking/drugging",
                description: "(for instance, decided not to drink before a certain hour in the day)",
                type: "dual-textarea",
                examplesField: "concept1_q4_examples",
                resultsField: "concept1_q4_results",
            },
            {
                id: "concept1_q5",
                label: "1.5 Have you ever awakened in the morning after drinking/drugging and found that you could not remember some part of the evening? Give examples:",
                type: "single-textarea",
                singleField: "concept1_q5",
            },
        ],
    },
    {
        title: "Concept 2: POWERLESSNESS over BAD RESULTS from Drinking/Drugging",
        bgColor: "bg-red-50",
        borderColor: "border-red-400",
        textColor: "text-red-900",
        questions: [
            {
                id: "concept2_q1",
                label: "2.1 What have you done to try to drink without bad results",
                description: "(for example, to drink only at home, or not to leave the house after starting to drink)",
                type: "dual-textarea",
                examplesField: "concept2_q1_examples",
                resultsField: "concept2_q1_results",
            },
            {
                id: "concept2_q2",
                label: "2.2 What have you done to try to limit or avoid the bad effects of drinking/drugging on your health",
                description: "(for example, take medication for alcohol-related high blood pressure or stomach problems)",
                type: "dual-textarea",
                examplesField: "concept2_q2_examples",
                resultsField: "concept2_q2_results",
            },
            {
                id: "concept2_q3",
                label: "2.3 How else did you try to control the results of your drinking/drugging, and were you successful?",
                type: "dual-textarea",
                examplesField: "concept2_q3_examples",
                resultsField: "concept2_q3_results",
            },
        ],
    },
    {
        title: "Concept 3: UNMANAGEABILITY",
        subtitle: "The Unacceptable Results of My Drinking/Drugging",
        bgColor: "bg-red-50",
        borderColor: "border-red-400",
        textColor: "text-red-900",
        questions: [
            {
                id: "concept3_q1",
                label: "3.1 What was it in your life that was unacceptable to you and brought you to Alcoholics Anonymous?",
                type: "single-textarea",
                singleField: "concept3_q1",
            },
            {
                id: "concept3_q2",
                label: "3.2 What crisis other than the one that finally brought you into AA would eventually have occurred?",
                type: "single-textarea",
                singleField: "concept3_q2",
            },
            {
                id: "concept3_q3",
                label: "3.3 How has drinking/drugging affected your self-esteem, self-image or self-respect?",
                type: "single-textarea",
                singleField: "concept3_q3",
            },
            {
                id: "concept3_q4",
                label: "3.4 Have you ever gotten into physical fights as a result of your drinking/drugging?",
                type: "single-textarea",
                singleField: "concept3_q4",
            },
            {
                id: "concept3_q5",
                label: "3.5 Have you ever lost a job or a promotion as a result of your drinking/drugging?",
                type: "single-textarea",
                singleField: "concept3_q5",
            },
            {
                id: "concept3_q6",
                label: "3.6 Have you ever lost a lover or significant friend as a result of your drinking/drugging?",
                type: "single-textarea",
                singleField: "concept3_q6",
            },
            {
                id: "concept3_q7",
                label: "3.7 Have you been hospitalized (regular or psychiatric) as a result of your drinking/drugging?",
                type: "single-textarea",
                singleField: "concept3_q7",
            },
            {
                id: "concept3_q8",
                label: "3.8 Have you been very depressed and/or felt life was not worth living (alcohol and other drugs often cause severe depression)? Have you attempted suicide?",
                type: "single-textarea",
                singleField: "concept3_q8",
            },
            {
                id: "concept3_q9",
                label: "3.9 How has drinking/drugging affected your goals for your life, and the progress you have made to achieve them?",
                type: "single-textarea",
                singleField: "concept3_q9",
            },
            {
                id: "concept3_q10",
                label: "3.10 How has drinking/drugging affected your health (heart, liver, stomach, skin, nervous system [peripheral neuropathy, or tingling/pain/numbness in fingers or toes])?",
                type: "single-textarea",
                singleField: "concept3_q10",
            },
            {
                id: "concept3_q11",
                label: "3.11 Give some examples of your drinking/drugging putting your life or the lives of others in danger?",
                type: "single-textarea",
                singleField: "concept3_q11",
            },
            {
                id: "concept3_q12",
                label: "3.12 What is it about your behavior when you drink that your lover/family/friends object to most?",
                type: "single-textarea",
                singleField: "concept3_q12",
            },
            {
                id: "concept3_q13",
                label: "3.13 Has any physical abuse happened to you or others as a result of your drinking/drugging?",
                type: "single-textarea",
                singleField: "concept3_q13",
            },
            {
                id: "concept3_q14",
                label: "3.14 How has your drinking/drugging adversely affected you even when you are sober?",
                type: "single-textarea",
                singleField: "concept3_q14",
            },
        ],
    },
    {
        title: "CONCLUSIONS",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-400",
        textColor: "text-amber-900",
        questions: [
            {
                id: "conclusion_q1",
                label: "4.1 What convinces you that you can no longer use alcohol or drugs safely?",
                type: "single-textarea",
                singleField: "conclusion_q1",
            },
            {
                id: "conclusion_q2",
                label: "4.2 Are you admitting or accepting? What is the difference between these two things? How are you accepting through your behavior?",
                type: "long-textarea",
                singleField: "conclusion_q2",
            },
            {
                id: "conclusion_q3",
                label: "4.3 Are you an alcoholic or chemically dependent person?",
                type: "long-textarea",
                singleField: "conclusion_q3",
            },
            {
                id: "conclusion_q4",
                label: "4.4 Give 15 reasons why you should continue in the program of Alcoholics Anonymous?",
                type: "multi-textarea",
                singleField: "conclusion_q4",
                count: 15,
            },
        ],
    },
]

interface QuestionBlockProps {
    question: QuestionConfig
    data: Step1Data
    onUpdateArray: (field: keyof Step1Data, index: number, value: string) => void
    onUpdateField: (field: keyof Step1Data, value: string) => void
}

const QuestionBlock = ({ question, data, onUpdateArray, onUpdateField }: QuestionBlockProps) => {
    const { id, label, description, type, examplesField, resultsField, singleField, count } = question

    if (type === "dual-textarea" && examplesField && resultsField) {
        const examples = data[examplesField] as string[]
        const results = data[resultsField] as string[]

        return (
            <div className="space-y-3">
                <label htmlFor={`${id}_0`} className="font-body text-sm text-amber-900 font-semibold">
                    {label}
                </label>
                {description && <p className="text-xs text-amber-900/60">{description}</p>}
                {examples.map((_, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            id={`${id}_example_${i}`}
                            aria-labelledby={id}
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={examples[i]}
                            onChange={(e) => onUpdateArray(examplesField, i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            id={`${id}_result_${i}`}
                            aria-labelledby={id}
                            placeholder="What was the result?"
                            value={results[i]}
                            onChange={(e) => onUpdateArray(resultsField, i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>
        )
    }

    if (type === "single-textarea" && singleField) {
        const values = data[singleField] as string[]

        return (
            <div className="space-y-3">
                <label htmlFor={`${id}_0`} className="font-body text-sm text-amber-900 font-semibold">
                    {label}
                </label>
                {description && <p className="text-xs text-amber-900/60">{description}</p>}
                {values.map((value, i) => (
                    <Textarea
                        key={i}
                        id={`${id}_${i}`}
                        aria-labelledby={id}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={value}
                        onChange={(e) => onUpdateArray(singleField, i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>
        )
    }

    if (type === "long-textarea" && singleField) {
        const value = data[singleField] as string

        return (
            <div className="space-y-3">
                <label htmlFor={id} className="font-body text-sm text-amber-900 font-semibold">
                    {label}
                </label>
                {description && <p className="text-xs text-amber-900/60">{description}</p>}
                <Textarea
                    id={id}
                    value={value}
                    onChange={(e) => onUpdateField(singleField, e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
        )
    }

    if (type === "multi-textarea" && singleField && count) {
        const values = data[singleField] as string[]

        return (
            <div className="space-y-3">
                <label htmlFor={`${id}_0`} className="font-body text-sm text-amber-900 font-semibold">
                    {label}
                </label>
                {description && <p className="text-xs text-amber-900/60">{description}</p>}
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-sm text-amber-900/60 mt-2">{i + 1}.</span>
                        <Textarea
                            id={`${id}_${i}`}
                            aria-labelledby={id}
                            placeholder={`Reason ${i + 1}`}
                            value={values[i] || ''}
                            onChange={(e) => onUpdateArray(singleField, i, e.target.value)}
                            className="min-h-[60px] flex-1"
                        />
                    </div>
                ))}
            </div>
        )
    }

    return null
}

export default function Step1WorksheetCard({ className: _className, ...props }: Step1WorksheetCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [section, setSection] = useState(1) // 1-4 for each concept section
    const [data, setData] = useState<Step1Data>(initialData)
    const [isSaving, setIsSaving] = useState(false)
    const { user } = useAuth()

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(data) !== JSON.stringify(initialData),
        [data]
    )

    const updateField = (field: keyof Step1Data, value: string) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const updateArrayField = (field: keyof Step1Data, index: number, value: string) => {
        setData(prev => {
            const current = prev[field] as string[]
            const updated = [...current]
            updated[index] = value
            return { ...prev, [field]: updated }
        })
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && hasUnsavedChanges) {
            if (confirm("You have unsaved changes. Are you sure you want to close?")) {
                setIsOpen(false)
                setData(initialData)
                setSection(1)
            }
        } else {
            setIsOpen(open)
            if (open) {
                // Reset form state when opening
                setSection(1)
                setData({ ...initialData })
            }
        }
    }

    const handleSave = async () => {
        if (!user) {
            toast.error("You must be signed in to save")
            return
        }

        setIsSaving(true)
        try {
            await FirestoreService.saveInventoryEntry(user.uid, {
                type: 'step-1-worksheet',
                data: data as unknown as Record<string, unknown>,
                tags: ['step-work', 'step-1', 'powerlessness', 'unmanageability'],
            })

            toast.success("Step 1 worksheet saved successfully!")
            setIsOpen(false)
            setData(initialData)
            setSection(1)
        } catch (error) {
            toast.error("Failed to save worksheet. Please try again.")
            console.error("Save error:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const currentSection = FORM_SECTIONS[section - 1]

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <motion.button
                        type="button"
                        {...props}
                        className="w-full bg-white/60 p-4 rounded-xl border-l-4 border-l-green-400 border border-amber-100 shadow-sm flex items-start gap-4"
                        whileHover={{ x: 4 }}
                    >
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-heading text-lg text-amber-900">Step 1 Worksheet</h3>
                            <p className="font-body text-xs text-amber-900/60 mt-1">
                                Powerlessness • Unmanageability • Acceptance
                            </p>
                        </div>
                    </motion.button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl text-amber-900">
                            Step 1 Worksheet
                        </DialogTitle>
                        <p className="text-sm text-amber-900/60">
                            Section {section} of 4: {currentSection.title}
                        </p>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className={`${currentSection.bgColor} border-l-4 ${currentSection.borderColor} p-4 rounded`}>
                            <h3 className={`font-heading text-lg ${currentSection.textColor} mb-2`}>
                                {currentSection.title}
                            </h3>
                            {currentSection.subtitle && (
                                <p className={`text-sm ${currentSection.textColor}/70`}>
                                    {currentSection.subtitle}
                                </p>
                            )}
                        </div>

                        {currentSection.questions.map((question) => (
                            <QuestionBlock
                                key={question.id}
                                question={question}
                                data={data}
                                onUpdateArray={updateArrayField}
                                onUpdateField={updateField}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSection(Math.max(1, section - 1))}
                            disabled={section === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>

                        <div className="text-sm text-amber-900/60">
                            {section} / 4
                        </div>

                        {section < 4 ? (
                            <Button
                                type="button"
                                onClick={() => setSection(section + 1)}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Worksheet"}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
