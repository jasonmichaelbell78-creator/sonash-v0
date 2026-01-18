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
import { PrivilegesTab } from "./privileges-tab";
import { useAdminTabContext, type AdminTabId } from "@/lib/contexts/admin-tab-context";
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
  Shield,
} from "lucide-react";

export function AdminTabs() {
  const { activeTab, setActiveTab } = useAdminTabContext();
  // System tabs - admin operations
  const systemTabs: Array<{
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "privileges", label: "Privileges", icon: Shield },
    { id: "jobs", label: "Jobs", icon: Clock },
    { id: "errors", label: "Errors", icon: AlertTriangle },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  // Content tabs - content management
  const contentTabs: Array<{
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
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
      id: AdminTabId;
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

      {/* Tab Content - ARIA compliant: all panels rendered, visibility controlled via hidden attribute */}
      {/* This ensures aria-controls on tab buttons always point to existing elements */}
      <div className="min-h-[400px]">
        <div
          role="tabpanel"
          id="admin-panel-dashboard"
          aria-labelledby="admin-tab-dashboard"
          hidden={activeTab !== "dashboard"}
        >
          <DashboardTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-users"
          aria-labelledby="admin-tab-users"
          hidden={activeTab !== "users"}
        >
          <UsersTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-privileges"
          aria-labelledby="admin-tab-privileges"
          hidden={activeTab !== "privileges"}
        >
          <PrivilegesTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-jobs"
          aria-labelledby="admin-tab-jobs"
          hidden={activeTab !== "jobs"}
        >
          <JobsTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-errors"
          aria-labelledby="admin-tab-errors"
          hidden={activeTab !== "errors"}
        >
          <ErrorsTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-logs"
          aria-labelledby="admin-tab-logs"
          hidden={activeTab !== "logs"}
        >
          <LogsTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-meetings"
          aria-labelledby="admin-tab-meetings"
          hidden={activeTab !== "meetings"}
        >
          <MeetingsTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-sober-living"
          aria-labelledby="admin-tab-sober-living"
          hidden={activeTab !== "sober-living"}
        >
          <SoberLivingTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-quotes"
          aria-labelledby="admin-tab-quotes"
          hidden={activeTab !== "quotes"}
        >
          <QuotesTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-slogans"
          aria-labelledby="admin-tab-slogans"
          hidden={activeTab !== "slogans"}
        >
          <SlogansTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-links"
          aria-labelledby="admin-tab-links"
          hidden={activeTab !== "links"}
        >
          <LinksTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-prayers"
          aria-labelledby="admin-tab-prayers"
          hidden={activeTab !== "prayers"}
        >
          <PrayersTab />
        </div>
        <div
          role="tabpanel"
          id="admin-panel-glossary"
          aria-labelledby="admin-tab-glossary"
          hidden={activeTab !== "glossary"}
        >
          <GlossaryTab />
        </div>
      </div>
    </div>
  );
}
