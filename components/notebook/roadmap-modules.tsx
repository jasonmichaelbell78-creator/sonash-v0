import React from "react"
import TodayPage from "./pages/today-page"
import ResourcesPage from "./pages/resources-page"
import HistoryPage from "./pages/history-page"
import PlaceholderPage from "./pages/placeholder-page"
import GrowthPage from "./pages/growth-page"
import { featureFlagEnabled } from "@/lib/utils"

import { NotebookModule, NotebookModuleId } from "./notebook-types"

export type { NotebookModule, NotebookModuleId }

export const notebookModules: NotebookModule[] = [
  {
    id: "today",
    label: "Today",
    color: "bg-sky-200",
    status: "available",
    description: "Daily check-in, clean time tracker, and journal scratchpad.",
    render: ({ nickname, onNavigate }) => <TodayPage nickname={nickname || "Friend"} onNavigate={onNavigate ? (id) => onNavigate(id) : () => { }} />,
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
    label: "Journal",
    color: "bg-amber-100",
    status: "available",
    description: "Your past journal entries and progress.",
    render: () => <HistoryPage />,
  },
]

export const getModuleById = (id: NotebookModuleId) => notebookModules.find((module) => module.id === id)

export const moduleIsEnabled = (module: NotebookModule) => {
  const enabled = module.status === "available" || (module.featureFlag ? featureFlagEnabled(module.featureFlag) : false)
  return enabled
}

export const moduleIsStubbed = (module: NotebookModule) => !moduleIsEnabled(module)
