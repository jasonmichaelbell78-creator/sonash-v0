import { ReactNode } from "react"
import TodayPage from "./pages/today-page"
import ResourcesPage from "./pages/resources-page"
import SupportPage from "./pages/support-page"
import PlaceholderPage from "./pages/placeholder-page"

export type NotebookModuleId = "today" | "resources" | "support" | "growth" | "work" | "more"

type ModuleStatus = "available" | "planned"

export interface NotebookModule {
  id: NotebookModuleId
  label: string
  color: string
  status: ModuleStatus
  featureFlag?: string
  description: string
  render: (options: { nickname: string }) => ReactNode
}

const featureFlagEnabled = (flag?: string) => {
  if (!flag) return true
  if (typeof process === "undefined") return false
  return process.env?.[flag] === "true"
}

export const notebookModules: NotebookModule[] = [
  {
    id: "today",
    label: "Today",
    color: "bg-sky-200",
    status: "available",
    description: "Daily check-in, clean time tracker, and journal scratchpad.",
    render: ({ nickname }) => <TodayPage nickname={nickname} />,
  },
  {
    id: "resources",
    label: "Resources",
    color: "bg-orange-200",
    status: "available",
    description: "Meeting finder, local resource map, and sober living info.",
    render: () => <ResourcesPage />,
  },
  {
    id: "support",
    label: "Support",
    color: "bg-green-200",
    status: "available",
    description: "SOS contacts and fast outreach tools.",
    render: () => <SupportPage />,
  },
  {
    id: "growth",
    label: "Growth",
    color: "bg-yellow-200",
    status: "planned",
    featureFlag: "NEXT_PUBLIC_ENABLE_GROWTH",
    description: "Step work, reflections, and growth exercises.",
    render: () => (
      <PlaceholderPage
        title="Growth"
        description="Step work, reflections, and personal development tools coming soon."
      />
    ),
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
]

export const getModuleById = (id: NotebookModuleId) => notebookModules.find((module) => module.id === id)

export const moduleIsEnabled = (module: NotebookModule) =>
  module.status === "available" || featureFlagEnabled(module.featureFlag)

export const moduleIsStubbed = (module: NotebookModule) => !moduleIsEnabled(module)
