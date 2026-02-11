"use client";

/**
 * DevDashboard - Main Development Dashboard Component
 *
 * Provides development tooling and monitoring:
 * - Lighthouse performance scores
 * - Session activity monitoring
 * - Error tracing
 * - Document sync status
 * - Override audit trail
 */

import { useState } from "react";
import { User } from "firebase/auth";
import { DevTabs, DevTabId } from "./dev-tabs";
import { LighthouseTab } from "./lighthouse-tab";

interface DevDashboardProps {
  user: User;
  onLogout: () => void;
}

export function DevDashboard({ user, onLogout }: Readonly<DevDashboardProps>) {
  const [activeTab, setActiveTab] = useState<DevTabId>("lighthouse");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <h1 className="text-xl font-semibold">Dev Dashboard</h1>
            <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Remote</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-400 hover:text-white text-sm">
              Admin Panel →
            </a>
            <span className="text-gray-400">{user?.email}</span>
            <button onClick={onLogout} className="text-gray-400 hover:text-white text-sm">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <DevTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "lighthouse" && <LighthouseTab />}
        {activeTab === "errors" && <PlaceholderTab title="Error Tracing" icon="🐛" />}
        {activeTab === "sessions" && <PlaceholderTab title="Session Activity" icon="📊" />}
        {activeTab === "docs" && <PlaceholderTab title="Document Sync" icon="📄" />}
        {activeTab === "overrides" && <PlaceholderTab title="Override Audit" icon="⚠️" />}
      </main>
    </div>
  );
}

// Placeholder for tabs not yet implemented
function PlaceholderTab({ title, icon }: Readonly<{ title: string; icon: string }>) {
  return (
    <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400">Coming soon in Operational Visibility Sprint</p>
      <p className="text-gray-500 text-sm mt-2">
        See OPERATIONAL_VISIBILITY_SPRINT.md for implementation plan
      </p>
    </div>
  );
}
