/**
 * Type declarations for Web Speech API
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
 */

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
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onstart: (() => void) | null
    onend: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    start(): void
    stop(): void
    abort(): void
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor
        webkitSpeechRecognition: SpeechRecognitionConstructor
    }
}

