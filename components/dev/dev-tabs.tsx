"use client";

/**
 * DevTabs - Tab navigation for Development Dashboard
 */

export type DevTabId = "lighthouse" | "errors" | "sessions" | "docs" | "overrides";

interface Tab {
  id: DevTabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "lighthouse",
    label: "Lighthouse",
    icon: "🚀",
    description: "Performance, accessibility, SEO scores",
  },
  {
    id: "errors",
    label: "Errors",
    icon: "🐛",
    description: "Error tracing and debugging",
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: "📊",
    description: "Development session activity",
  },
  {
    id: "docs",
    label: "Docs",
    icon: "📄",
    description: "Document sync status",
  },
  {
    id: "overrides",
    label: "Overrides",
    icon: "⚠️",
    description: "Rule override audit trail",
  },
];

interface DevTabsProps {
  activeTab: DevTabId;
  setActiveTab: (tab: DevTabId) => void;
}

export function DevTabs({ activeTab, setActiveTab }: DevTabsProps) {
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
                }
              `}
              title={tab.description}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
