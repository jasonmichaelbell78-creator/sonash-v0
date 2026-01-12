"use client";

import { Lightbulb, X } from "lucide-react";
import { useState } from "react";

interface SmartPromptProps {
  type: "check-in-reminder" | "halt-suggestion" | "streak-celebration" | "no-cravings-streak";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export function SmartPrompt({ type, message, action, onDismiss }: SmartPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const styles = {
    "check-in-reminder": {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      icon: "text-amber-500",
    },
    "halt-suggestion": {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      icon: "text-amber-500",
    },
    "streak-celebration": {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      icon: "text-green-500",
    },
    "no-cravings-streak": {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-900",
      icon: "text-purple-500",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-lg p-4 mb-4 animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-start gap-3">
        <Lightbulb className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-body ${style.text}`}>{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-2 text-sm font-medium ${style.text} underline hover:no-underline`}
            >
              {action.label} →
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={`${style.text} opacity-50 hover:opacity-100 transition-opacity`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
