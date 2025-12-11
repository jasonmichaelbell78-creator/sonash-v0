"use client"

import { useEffect, useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

interface AuthErrorBannerProps {
  className?: string
}

const seenMessages = new Set<string>()

export function AuthErrorBanner({ className }: AuthErrorBannerProps) {
  const { profileError, todayLogError, profileNotFound } = useAuth()

  const messages = useMemo(() => {
    const list: string[] = []
    if (profileError) list.push(profileError)
    if (todayLogError) list.push(todayLogError)
    if (profileNotFound) list.push("We couldn't find your profile. Complete onboarding to continue.")
    return list
  }, [profileError, profileNotFound, todayLogError])

  useEffect(() => {
    messages.forEach((message) => {
      if (!seenMessages.has(message)) {
        toast.error(message)
        seenMessages.add(message)
      }
    })
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div
      className={`max-w-2xl mx-auto mb-4 rounded-lg border border-red-200 bg-red-50/90 text-red-900 shadow-sm backdrop-blur ${className || ""}`}
    >
      <div className="flex items-start gap-3 p-3">
        <AlertCircle className="h-5 w-5 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
