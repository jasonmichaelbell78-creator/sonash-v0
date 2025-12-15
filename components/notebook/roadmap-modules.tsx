import React from "react"
import TodayPage from "./pages/today-page"
import ResourcesPage from "./pages/resources-page"
import HistoryPage from "./pages/history-page"
import PlaceholderPage from "./pages/placeholder-page"
import GrowthPage from "./pages/growth-page"
import { featureFlagEnabled } from "@/lib/utils"

export type NotebookModuleId = "today" | "resources" | "growth" | "work" | "more" | "history" | "community" | "support"

export interface NotebookModule {
  id: NotebookModuleId
  label: string
  color: string
  status: "available" | "planned"
  featureFlag?: string
  description: string
  render: (props: { nickname?: string; onNavigate?: (id: string) => void }) => React.ReactNode
}

export const notebookModules: NotebookModule[] = [
  {
    id: "today",
    label: "Today",
    color: "bg-sky-200",
    status: "available",
    description: "Daily check-in, clean time tracker, and journal scratchpad.",
    render: ({ nickname, onNavigate }) => <TodayPage nickname={nickname || "Friend"} onNavigate={onNavigate} />,
  },
  {
    id: "resources",
    label: "Resources",
    color: "bg-emerald-200",
    status: "available",
    description: "Find meetings, readings, and recovery tools.",
    render: () => <ResourcesPage />,
  },
  {
    id: "growth",
    label: "Growth",
    color: "bg-yellow-200",
    status: "available",
    featureFlag: "NEXT_PUBLIC_ENABLE_GROWTH",
    description: "Step work, reflections, and growth exercises.",
    render: ({ onNavigate }) => <GrowthPage onNavigate={onNavigate} />,
  },
  {
    id: "support",
    label: "Support",
    color: "bg-orange-200",
    status: "available",
    description: "Emergency contacts and help lines.",
    render: () => <PlaceholderPage title="Support" description="Emergency contacts and crisis resources." />,
  },
  {
    id: "work",
    label: "Work",
    color: "bg-purple-200",
    status: "planned",
    featureFlag: "NEXT_PUBLIC_ENABLE_WORK",
    description: "Employment resources, resume tools, and job search features.",
    render: () => (
      <PlaceholderPage
        title="Work"
        description="Employment resources, resume tools, and job search features coming soon."
      />
    ),
  },
  {
    id: "more",
    label: "More",
    color: "bg-pink-200",
    status: "planned",
    featureFlag: "NEXT_PUBLIC_ENABLE_MORE",
    description: "Overflow notebook modules, settings, and experiments.",
    render: () => <PlaceholderPage title="More" description="Additional features and settings coming soon." />,
  },
  {
    id: "history",
    label: "History",
    color: "bg-amber-100",
    status: "available",
    description: "Your past journal entries and progress.",
    render: () => <HistoryPage />,
  },
]

export const getModuleById = (id: NotebookModuleId) => notebookModules.find((module) => module.id === id)

export const moduleIsEnabled = (module: NotebookModule) =>
  module.status === "available" || featureFlagEnabled(module.featureFlag)

export const moduleIsStubbed = (module: NotebookModule) => !moduleIsEnabled(module)
