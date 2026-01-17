"use client";

import type React from "react";
import { DashboardTab } from "./dashboard-tab";
import { MeetingsTab } from "./meetings-tab";
import { SoberLivingTab } from "./sober-living-tab";
import { QuotesTab } from "./quotes-tab";
import { GlossaryTab } from "./glossary-tab";
import { SlogansTab } from "./slogans-tab";
import LinksTab from "./links-tab";
import PrayersTab from "./prayers-tab";
import { UsersTab } from "./users-tab";
import { JobsTab } from "./jobs-tab";
import { ErrorsTab } from "./errors-tab";
import { LogsTab } from "./logs-tab";
import {
  LayoutDashboard,
  Home,
  Users,
  Quote,
  Book,
  Lightbulb,
  Link,
  Heart,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminTabs({ activeTab, setActiveTab }: AdminTabsProps) {
  // System tabs - admin operations
  const systemTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "jobs", label: "Jobs", icon: Clock },
    { id: "errors", label: "Errors", icon: AlertTriangle },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  // Content tabs - content management
  const contentTabs = [
    { id: "meetings", label: "Meetings", icon: Home },
    { id: "sober-living", label: "Sober Living", icon: Home },
    { id: "quotes", label: "Daily Quotes", icon: Quote },
    { id: "slogans", label: "Slogans", icon: Lightbulb },
    { id: "links", label: "Quick Links", icon: Link },
    { id: "prayers", label: "Prayers", icon: Heart },
    { id: "glossary", label: "Glossary", icon: Book },
  ];

  const TabButton = ({
    tab,
  }: {
    tab: {
      id: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    };
  }) => {
    const Icon = tab.icon;
    const selected = activeTab === tab.id;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab.id)}
        role="tab"
        id={`admin-tab-${tab.id}`}
        aria-selected={selected}
        aria-controls={`admin-panel-${tab.id}`}
        tabIndex={selected ? 0 : -1}
        aria-label={tab.label}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
          ${
            selected
              ? "bg-amber-500 text-white shadow-sm"
              : "text-amber-900/70 hover:text-amber-900 hover:bg-amber-100"
          }`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Stacked 2-row layout */}
      <div className="space-y-3 bg-amber-50/50 rounded-lg p-3 border border-amber-200/60">
        {/* Row 1: System Tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="System admin tabs">
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wide self-center mr-2">
            System
          </span>
          {systemTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>

        {/* Row 2: Content Tabs */}
        <div
          className="flex flex-wrap gap-2 border-t border-amber-200/60 pt-3"
          role="tablist"
          aria-label="Content admin tabs"
        >
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wide self-center mr-2">
            Content
          </span>
          {contentTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "errors" && <ErrorsTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "sober-living" && <SoberLivingTab />}
        {activeTab === "quotes" && <QuotesTab />}
        {activeTab === "slogans" && <SlogansTab />}
        {activeTab === "links" && <LinksTab />}
        {activeTab === "prayers" && <PrayersTab />}
        {activeTab === "glossary" && <GlossaryTab />}
      </div>
    </div>
  );
}
