"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import TabNavigation from "./tab-navigation";
import BookmarkRibbon from "./bookmark-ribbon";
import StickyNote from "./sticky-note";
import PlaceholderPage from "./pages/placeholder-page";
import { useAuth } from "@/components/providers/auth-provider";
import { logger } from "@/lib/logger";
import { Shield, AlertTriangle } from "lucide-react";

import {
  getModuleById,
  moduleIsEnabled,
  moduleIsStubbed,
  notebookModules,
  type NotebookModuleId,
} from "./roadmap-modules";

// Lazy load modals
const AccountLinkModal = dynamic(() => import("@/components/auth/account-link-modal"), {
  loading: () => null,
  ssr: false,
});

const SettingsPage = dynamic(() => import("@/components/settings/settings-page"), {
  loading: () => null,
  ssr: false,
});

interface NotebookShellProps {
  onClose: () => void;
  nickname: string;
}

interface AccountSecuritySectionProps {
  isAnonymous: boolean;
  showLinkPrompt: boolean;
  email?: string;
  onSecureAccount: () => void;
}

/**
 * Account security status display for settings menu
 */
function AccountSecuritySection({
  isAnonymous,
  showLinkPrompt,
  email,
  onSecureAccount,
}: AccountSecuritySectionProps) {
  if (!isAnonymous && email) {
    return (
      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          <p className="font-handlee text-sm text-green-800">Signed in as {email}</p>
        </div>
      </div>
    );
  }

  if (isAnonymous) {
    const isWarning = showLinkPrompt;
    const bgClass = isWarning ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200";
    const textClass = isWarning ? "text-amber-800" : "text-blue-800";
    const linkClass = isWarning
      ? "text-amber-700 hover:text-amber-900"
      : "text-blue-700 hover:text-blue-900";
    const message = isWarning
      ? "Your journal is at risk! Link your account to keep your entries safe."
      : "Your account is anonymous. Link it to keep your data safe.";
    const Icon = isWarning ? AlertTriangle : Shield;
    const iconClass = isWarning ? "text-amber-600" : "text-blue-600";

    return (
      <div className={`p-3 rounded-lg border ${bgClass}`}>
        <div className="flex items-start gap-2">
          <Icon className={`w-5 h-5 ${iconClass} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`font-handlee text-sm ${textClass}`}>{message}</p>
            <button
              onClick={onSecureAccount}
              className={`mt-2 text-sm font-handlee underline ${linkClass}`}
            >
              Secure My Account →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Handle swipe gestures to navigate between tabs
 */
function handleSwipeNavigation(
  touchStart: number | null,
  touchEnd: number | null,
  currentIndex: number,
  tabs: Array<{ id: string }>,
  handleTabChange: (id: string) => void
): void {
  if (!touchStart || !touchEnd) return;

  const distance = touchStart - touchEnd;
  const isLeftSwipe = distance > 50;
  const isRightSwipe = distance < -50;

  if (isLeftSwipe && currentIndex < tabs.length - 1) {
    handleTabChange(tabs[currentIndex + 1].id);
  } else if (isRightSwipe && currentIndex > 0) {
    handleTabChange(tabs[currentIndex - 1].id);
  }
}

/**
 * Handle sign out action
 */
async function handleSignOut(onClose: () => void): Promise<void> {
  try {
    const { signOut } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase");

    // Clear local temp data for security
    localStorage.removeItem("sonash_journal_temp");

    await signOut(auth);
    onClose();
  } catch (error) {
    logger.error("Sign out failed", { error });
    const { toast } = await import("sonner");
    toast.error("Failed to sign out. Please try again.");
  }
}

export default function NotebookShell({ onClose, nickname }: NotebookShellProps) {
  const { isAnonymous, showLinkPrompt, profile } = useAuth();
  const tabs = notebookModules.map((module) => ({
    id: module.id,
    label: module.label,
    color: module.color,
    planned: moduleIsStubbed(module),
  }));

  const [activeTab, setActiveTab] = useState<NotebookModuleId>("today");
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountLink, setShowAccountLink] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTabChange = (tabId: string) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const newIndex = tabs.findIndex((t) => t.id === tabId);
    setDirection(newIndex > currentIndex ? 1 : -1);
    // Safe cast: tabs are derived from notebookModules, so tabId is always a valid NotebookModuleId
    setActiveTab(tabId as NotebookModuleId);
  };

  const renderPage = () => {
    const module = getModuleById(activeTab) ?? notebookModules[0];

    if (moduleIsEnabled(module)) {
      // Pass handleTabChange as onNavigate
      return module.render({ nickname, onNavigate: handleTabChange });
    }

    const flagText = module.featureFlag
      ? `Enable ${module.label} by setting ${module.featureFlag}=true.`
      : "This section is planned on the roadmap.";

    return (
      <PlaceholderPage
        title={`${module.label} (stub)`}
        description={`${module.description} ${flagText}`}
      />
    );
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Book shadow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[95%] h-10 bg-black/40 blur-2xl rounded-full" />

      {/* Main notebook container */}
      <div
        className="relative w-[340px] h-[520px] md:w-[800px] md:h-[560px] rounded-lg overflow-visible"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 12px 24px -8px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Spine */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 md:w-10 z-20 rounded-l-lg"
          style={{
            background: `
              linear-gradient(90deg, rgba(60, 100, 115, 1) 0%, rgba(70, 115, 130, 1) 50%, rgba(50, 85, 100, 1) 100%)
            `,
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3)",
          }}
        >
          {/* Spine texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Page content area */}
        <div
          className="absolute left-4 md:left-10 right-0 top-0 bottom-0 rounded-r-lg overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #e5dfd3 100%)`,
          }}
        >
          {/* Paper texture */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Lined paper effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-sky-200/30"
                style={{ top: `${(i + 1) * 22}px` }}
              />
            ))}
          </div>

          {/* Red margin line */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-red-300/40" />

          {/* Page content with swipe animation */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              className="absolute inset-0 p-4 pl-8 pr-4 md:p-6 md:pl-16 md:pr-12 touch-pan-y"
              onTouchStart={(e) => {
                setTouchEnd(null);
                setTouchStart(e.targetTouches[0].clientX);
              }}
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                handleSwipeNavigation(touchStart, touchEnd, currentIndex, tabs, handleTabChange);
              }}
              initial={{
                rotateY: direction > 0 ? 90 : -90,
                opacity: 0,
                originX: direction > 0 ? 0 : 1,
              }}
              animate={{
                rotateY: 0,
                opacity: 1,
              }}
              exit={{
                rotateY: direction > 0 ? -90 : 90,
                opacity: 0,
                originX: direction > 0 ? 0 : 1,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab navigation */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Bookmark ribbon for settings */}
        <BookmarkRibbon onClick={() => setShowSettings(true)} />
      </div>

      {/* Settings sticky note overlay */}
      <AnimatePresence>
        {showSettings && (
          <StickyNote title="My Notebook" onClose={() => setShowSettings(false)}>
            <div className="space-y-3">
              <AccountSecuritySection
                isAnonymous={isAnonymous}
                showLinkPrompt={showLinkPrompt}
                email={profile?.email}
                onSecureAccount={() => {
                  setShowSettings(false);
                  setShowAccountLink(true);
                }}
              />

              {/* Manage Profile Link */}
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowSettingsPage(true);
                }}
                className="w-full text-left p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <p className="font-handlee text-amber-800 font-medium">Manage Profile →</p>
                <p className="font-body text-amber-700/70 text-sm">
                  Edit nickname, clean date, and preferences
                </p>
              </button>

              <div className="pt-4 border-t border-amber-900/10">
                <button
                  onClick={() => handleSignOut(onClose)}
                  className="font-handlee text-red-800/70 hover:text-red-800 hover:underline flex items-center gap-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </StickyNote>
        )}
      </AnimatePresence>

      {/* Account Link Modal */}
      <AnimatePresence>
        {showAccountLink && (
          <AccountLinkModal
            onClose={() => setShowAccountLink(false)}
            onSuccess={() => setShowAccountLink(false)}
          />
        )}
      </AnimatePresence>

      {/* Settings Page (Full Screen Modal) */}
      <AnimatePresence>
        {showSettingsPage && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#111]"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSettingsPage(false);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SettingsPage onClose={() => setShowSettingsPage(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
