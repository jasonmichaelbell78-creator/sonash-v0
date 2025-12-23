"use client"

import { useState } from "react"
import { Phone, MapPin, Heart, Zap, X } from "lucide-react"
import { NotebookModuleId } from "../notebook-types"

interface QuickActionsFabProps {
  onNavigate: (id: NotebookModuleId) => void
  onQuickMood?: () => void
}

export function QuickActionsFab({ onNavigate, onQuickMood }: QuickActionsFabProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      icon: Zap,
      label: "Quick Mood",
      color: "bg-yellow-500 hover:bg-yellow-600",
      onClick: () => {
        onQuickMood?.()
        setIsOpen(false)
      }
    },
    {
      icon: Phone,
      label: "Call Sponsor",
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => {
        // Future: integrate with contacts
        window.location.href = "tel:"
        setIsOpen(false)
      }
    },
    {
      icon: MapPin,
      label: "Find Meeting",
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => {
        onNavigate("meetings")
        setIsOpen(false)
      }
    },
    {
      icon: Heart,
      label: "Resources",
      color: "bg-red-500 hover:bg-red-600",
      onClick: () => {
        onNavigate("resources")
        setIsOpen(false)
      }
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      {/* Action buttons */}
      <div className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {actions.map((action, index) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`${action.color} text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center gap-2 group`}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 group-hover:ml-2">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700 rotate-45"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        }`}
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  )
}
