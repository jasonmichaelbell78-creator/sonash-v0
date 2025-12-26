"use client"

import { useState } from "react"
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

export default function Step1WorksheetCard({ className: _className, ...props }: Step1WorksheetCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [section, setSection] = useState(1) // 1-4 for each concept section
    const [data, setData] = useState<Step1Data>(initialData)
    const [isSaving, setIsSaving] = useState(false)
    const { user } = useAuth()

    const updateField = (field: keyof Step1Data, value: string | string[]) => {
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

    const handleSave = async () => {
        if (!user) {
            toast.error("You must be signed in to save")
            return
        }

        setIsSaving(true)
        try {
            await FirestoreService.saveInventoryEntry(user.uid, {
                type: 'step-1-worksheet',
                data: data,
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

    const renderConcept1 = () => (
        <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <h3 className="font-heading text-lg text-red-900 mb-2">
                    Concept 1: POWERLESSNESS over AMOUNT of Alcohol Consumed
                </h3>
            </div>

            {/* Question 1.1 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    1.1 Have you ever tried to stop drinking/drugging completely? Give examples:
                </label>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept1_q1_examples[i]}
                            onChange={(e) => updateArrayField('concept1_q1_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept1_q1_results[i]}
                            onChange={(e) => updateArrayField('concept1_q1_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>

            {/* Question 1.2 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    1.2 Have you ever tried to limit or control the amount of alcohol or drugs you used by limiting dosage?
                </label>
                <p className="text-xs text-amber-900/60">
                    (for instance, promising yourself or someone else you would have only 2 drinks at a party)
                </p>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept1_q2_examples[i]}
                            onChange={(e) => updateArrayField('concept1_q2_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept1_q2_results[i]}
                            onChange={(e) => updateArrayField('concept1_q2_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>

            {/* Question 1.3 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    1.3 Give examples of how you tried to limit or control the amount of alcohol or drugs you used by switching drinks
                </label>
                <p className="text-xs text-amber-900/60">
                    (for instance, switched from straight liquor to a mixed drink or beer, or switched to a drink you do not like)
                </p>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept1_q3_examples[i]}
                            onChange={(e) => updateArrayField('concept1_q3_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept1_q3_results[i]}
                            onChange={(e) => updateArrayField('concept1_q3_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>

            {/* Question 1.4 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    1.4 Give examples of how you tried to limit or control the amount of alcohol or drugs you used by limiting the time for drinking/drugging
                </label>
                <p className="text-xs text-amber-900/60">
                    (for instance, decided not to drink before a certain hour in the day)
                </p>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept1_q4_examples[i]}
                            onChange={(e) => updateArrayField('concept1_q4_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept1_q4_results[i]}
                            onChange={(e) => updateArrayField('concept1_q4_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>

            {/* Question 1.5 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    1.5 Have you ever awakened in the morning after drinking/drugging and found that you could not remember some part of the evening? Give examples:
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Example ${String.fromCharCode(97 + i)}`}
                        value={data.concept1_q5[i]}
                        onChange={(e) => updateArrayField('concept1_q5', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>
        </div>
    )

    const renderConcept2 = () => (
        <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <h3 className="font-heading text-lg text-red-900 mb-2">
                    Concept 2: POWERLESSNESS over BAD RESULTS from Drinking/Drugging
                </h3>
            </div>

            {/* Question 2.1 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    2.1 What have you done to try to drink without bad results
                </label>
                <p className="text-xs text-amber-900/60">
                    (for example, to drink only at home, or not to leave the house after starting to drink)
                </p>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept2_q1_examples[i]}
                            onChange={(e) => updateArrayField('concept2_q1_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept2_q1_results[i]}
                            onChange={(e) => updateArrayField('concept2_q1_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>

            {/* Question 2.2 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    2.2 What have you done to try to limit or avoid the bad effects of drinking/drugging on your health
                </label>
                <p className="text-xs text-amber-900/60">
                    (for example, take medication for alcohol-related high blood pressure or stomach problems)
                </p>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept2_q2_examples[i]}
                            onChange={(e) => updateArrayField('concept2_q2_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept2_q2_results[i]}
                            onChange={(e) => updateArrayField('concept2_q2_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>

            {/* Question 2.3 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    2.3 How else did you try to control the results of your drinking/drugging, and were you successful?
                </label>
                {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                        <Textarea
                            placeholder={`Example ${String.fromCharCode(97 + i)}`}
                            value={data.concept2_q3_examples[i]}
                            onChange={(e) => updateArrayField('concept2_q3_examples', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                        <Textarea
                            placeholder="What was the result?"
                            value={data.concept2_q3_results[i]}
                            onChange={(e) => updateArrayField('concept2_q3_results', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>
        </div>
    )

    const renderConcept3 = () => (
        <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <h3 className="font-heading text-lg text-red-900 mb-2">
                    Concept 3: UNMANAGEABILITY
                </h3>
                <p className="text-sm text-red-900/70">The Unacceptable Results of My Drinking/Drugging</p>
            </div>

            {/* Question 3.1 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.1 What was it in your life that was unacceptable to you and brought you to Alcoholics Anonymous?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q1[i]}
                        onChange={(e) => updateArrayField('concept3_q1', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.2 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.2 What crisis other than the one that finally brought you into AA would eventually have occurred?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q2[i]}
                        onChange={(e) => updateArrayField('concept3_q2', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.3 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.3 How has drinking/drugging affected your self-esteem, self-image or self-respect?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q3[i]}
                        onChange={(e) => updateArrayField('concept3_q3', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.4 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.4 Have you ever gotten into physical fights as a result of your drinking/drugging?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q4[i]}
                        onChange={(e) => updateArrayField('concept3_q4', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.5 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.5 Have you ever lost a job or a promotion as a result of your drinking/drugging?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q5[i]}
                        onChange={(e) => updateArrayField('concept3_q5', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.6 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.6 Have you ever lost a lover or significant friend as a result of your drinking/drugging?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q6[i]}
                        onChange={(e) => updateArrayField('concept3_q6', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.7 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.7 Have you been hospitalized (regular or psychiatric) as a result of your drinking/drugging?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q7[i]}
                        onChange={(e) => updateArrayField('concept3_q7', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.8 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.8 Have you been very depressed and/or felt life was not worth living (alcohol and other drugs often cause severe depression)? Have you attempted suicide?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q8[i]}
                        onChange={(e) => updateArrayField('concept3_q8', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.9 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.9 How has drinking/drugging affected your goals for your life, and the progress you have made to achieve them?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q9[i]}
                        onChange={(e) => updateArrayField('concept3_q9', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.10 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.10 How has drinking/drugging affected your health (heart, liver, stomach, skin, nervous system [peripheral neuropathy, or tingling/pain/numbness in fingers or toes])?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q10[i]}
                        onChange={(e) => updateArrayField('concept3_q10', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.11 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.11 Give some examples of your drinking/drugging putting your life or the lives of others in danger?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q11[i]}
                        onChange={(e) => updateArrayField('concept3_q11', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.12 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.12 What is it about your behavior when you drink that your lover/family/friends object to most?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q12[i]}
                        onChange={(e) => updateArrayField('concept3_q12', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.13 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.13 Has any physical abuse happened to you or others as a result of your drinking/drugging?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q13[i]}
                        onChange={(e) => updateArrayField('concept3_q13', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 3.14 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    3.14 How has your drinking/drugging adversely affected you even when you are sober?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.concept3_q14[i]}
                        onChange={(e) => updateArrayField('concept3_q14', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>
        </div>
    )

    const renderConclusions = () => (
        <div className="space-y-6">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <h3 className="font-heading text-lg text-amber-900 mb-2">
                    CONCLUSIONS
                </h3>
            </div>

            {/* Question 4.1 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    4.1 What convinces you that you can no longer use alcohol or drugs safely?
                </label>
                {[0, 1, 2].map(i => (
                    <Textarea
                        key={i}
                        placeholder={`Response ${String.fromCharCode(97 + i)}`}
                        value={data.conclusion_q1[i]}
                        onChange={(e) => updateArrayField('conclusion_q1', i, e.target.value)}
                        className="min-h-[60px]"
                    />
                ))}
            </div>

            {/* Question 4.2 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    4.2 Are you admitting or accepting? What is the difference between these two things? How are you accepting through your behavior?
                </label>
                <Textarea
                    value={data.conclusion_q2}
                    onChange={(e) => updateField('conclusion_q2', e.target.value)}
                    className="min-h-[100px]"
                />
            </div>

            {/* Question 4.3 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    4.3 Are you an alcoholic or chemically dependent person?
                </label>
                <Textarea
                    value={data.conclusion_q3}
                    onChange={(e) => updateField('conclusion_q3', e.target.value)}
                    className="min-h-[60px]"
                />
            </div>

            {/* Question 4.4 */}
            <div className="space-y-3">
                <label className="font-body text-sm text-amber-900 font-semibold">
                    4.4 Give 15 reasons why you should continue in the program of Alcoholics Anonymous?
                </label>
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-sm text-amber-900/60 mt-2">{i + 1}.</span>
                        <Textarea
                            placeholder={`Reason ${i + 1}`}
                            value={data.conclusion_q4[i]}
                            onChange={(e) => updateArrayField('conclusion_q4', i, e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <motion.button
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
                            Section {section} of 4: {
                                section === 1 ? "Powerlessness over Amount" :
                                    section === 2 ? "Powerlessness over Bad Results" :
                                        section === 3 ? "Unmanageability" :
                                            "Conclusions"
                            }
                        </p>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {section === 1 && renderConcept1()}
                        {section === 2 && renderConcept2()}
                        {section === 3 && renderConcept3()}
                        {section === 4 && renderConclusions()}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button
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
                                onClick={() => setSection(section + 1)}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
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
