"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

interface AuthErrorBannerProps {
  className?: string;
}

export function AuthErrorBanner({ className }: Readonly<AuthErrorBannerProps>) {
  const { profileError, todayLogError, profileNotFound } = useAuth();
  const [seenMessages, setSeenMessages] = useState<Set<string>>(() => new Set());

  const messages = useMemo(() => {
    const list: string[] = [];
    if (profileError) list.push(profileError);
    // Only show today log error if we have a profile - new users have no logs (expected)
    if (todayLogError && !profileNotFound) list.push(todayLogError);
    if (profileNotFound)
      list.push("We couldn't find your profile. Complete onboarding to continue.");
    return list;
  }, [profileError, profileNotFound, todayLogError]);

  useEffect(() => {
    const unseen = messages.filter((msg) => !seenMessages.has(msg));
    if (unseen.length > 0) {
      unseen.forEach((message) => toast.error(message));
      setSeenMessages((prev) => {
        const next = new Set(prev);
        unseen.forEach((msg) => next.add(msg));
        return next;
      });
    }
  }, [messages, seenMessages]);

  if (messages.length === 0) return null;

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
  );
}
