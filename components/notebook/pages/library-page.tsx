"use client";

import { useState, useEffect } from "react";
import { Book, Users, Link2, Heart, Search, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllQuickLinks, getAllPrayers, QuickLink, Prayer } from "@/lib/db/library";
import { logger } from "@/lib/logger";

type LibrarySection = "home" | "glossary" | "etiquette" | "links" | "prayers";

const sections = [
  {
    id: "glossary" as const,
    title: "Glossary",
    icon: Book,
    description: "Recovery terms, slogans, and acronyms",
    color: "bg-amber-100",
  },
  {
    id: "etiquette" as const,
    title: "Meeting Etiquette",
    icon: Users,
    description: "Your first meeting guide",
    color: "bg-blue-100",
  },
  {
    id: "links" as const,
    title: "Quick Links",
    icon: Link2,
    description: "AA/NA sites, hotlines, online meetings",
    color: "bg-green-100",
  },
  {
    id: "prayers" as const,
    title: "Prayers",
    icon: Heart,
    description: "Serenity, Step, and daily prayers",
    color: "bg-purple-100",
  },
];

export default function LibraryPage() {
  const [activeSection, setActiveSection] = useState<LibrarySection>("home");

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence mode="wait">
        {activeSection === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4">
              <h1 className="font-heading text-2xl text-amber-900">📚 The Library</h1>
              <p className="font-body text-amber-900/60 text-sm">
                Your recovery reference collection
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`${section.color} p-4 rounded-xl text-left hover:shadow-md transition-all group border border-amber-200/50`}
                >
                  <div className="flex items-start gap-3">
                    <section.icon className="w-6 h-6 text-amber-800 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-heading-alt text-lg text-amber-900 group-hover:text-amber-700">
                        {section.title}
                      </h3>
                      <p className="font-body text-sm text-amber-900/60">{section.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            <button
              onClick={() => setActiveSection("home")}
              className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-4 font-body text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </button>

            {activeSection === "glossary" && <GlossarySection />}
            {activeSection === "etiquette" && <EtiquetteSection />}
            {activeSection === "links" && <LinksSection />}
            {activeSection === "prayers" && <PrayersSection />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ====== GLOSSARY SECTION ======
import { glossaryData } from "@/data/glossary";

function GlossarySection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = glossaryData.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categoryLabels: Record<string, string> = {
    all: "All",
    acronyms: "Acronyms",
    clinical: "Clinical",
    culture: "Culture",
    slang: "Slang",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <h2 className="font-heading-alt text-xl text-amber-900 mb-1">📖 Glossary</h2>
      <p className="font-body text-xs text-amber-600 mb-3">{glossaryData.length} terms</p>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg bg-white/50 font-body text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-body ${
              filter === key
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {filtered.map((item, i) => (
          <div
            key={`${item.term}-${i}`}
            className="bg-white/60 border border-amber-100 rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-heading-alt text-amber-900">{item.term}</h4>
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded capitalize">
                {item.category}
              </span>
            </div>
            <p className="font-body text-sm text-amber-800/70 mt-1">{item.definition}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-amber-500 py-8 font-body">No results found</p>
        )}
      </div>
    </div>
  );
}

// ====== ETIQUETTE SECTION ======
function EtiquetteSection() {
  return (
    <div className="flex-1 overflow-y-auto pr-2">
      <h2 className="font-heading-alt text-xl text-amber-900 mb-4">🤝 Meeting Etiquette</h2>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-heading-alt text-blue-900 mb-2">Your First Meeting</h3>
          <ul className="font-body text-sm text-blue-800/80 space-y-2">
            <li>• Arrive 5-10 minutes early if possible</li>
            <li>• You don't have to speak if you don't want to</li>
            <li>• Just say "I'm [name], and I'm just listening today"</li>
            <li>• What's said in the meeting stays in the meeting</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-heading-alt text-amber-900 mb-2">Open vs Closed Meetings</h3>
          <ul className="font-body text-sm text-amber-800/80 space-y-2">
            <li>
              <strong>Open:</strong> Anyone can attend (family, friends, curious)
            </li>
            <li>
              <strong>Closed:</strong> Only for those who identify as having a desire to stop
              drinking/using
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-heading-alt text-green-900 mb-2">Sharing Tips</h3>
          <ul className="font-body text-sm text-green-800/80 space-y-2">
            <li>• Keep shares focused on your experience</li>
            <li>• Avoid giving direct advice ("You should...")</li>
            <li>• Speak from "I" statements</li>
            <li>• Be mindful of time (usually 2-3 minutes)</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-heading-alt text-purple-900 mb-2">Common Formats</h3>
          <ul className="font-body text-sm text-purple-800/80 space-y-2">
            <li>
              <strong>Speaker:</strong> One person shares their story (15-30 min)
            </li>
            <li>
              <strong>Discussion:</strong> Topic-based group share
            </li>
            <li>
              <strong>Step Study:</strong> Focus on one of the 12 Steps
            </li>
            <li>
              <strong>Big Book:</strong> Reading and discussing the text
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ====== LINKS SECTION ======
function LinksSection() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      try {
        // Fetch public links (isActive=true)
        const data = await getAllQuickLinks(false);
        setLinks(data);
      } catch (error) {
        logger.error("Failed to load links", { error });
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-amber-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading links...
      </div>
    );
  }

  const renderLinkGroup = (
    title: string,
    category: string,
    color: "amber" | "blue" | "red" | "emerald" | "purple",
    icon: string = "↗"
  ) => {
    const filtered = links.filter((l) => l.category === category);
    if (filtered.length === 0) return null;

    const colors = {
      amber: {
        title: "text-amber-600",
        bg: "bg-white/60",
        border: "border-amber-100",
        hover: "hover:bg-amber-50 hover:border-amber-300",
        text: "text-amber-900",
        desc: "text-amber-700/60",
        icon: "text-amber-400",
      },
      blue: {
        title: "text-blue-600",
        bg: "bg-blue-50/60",
        border: "border-blue-100",
        hover: "hover:bg-blue-100 hover:border-blue-300",
        text: "text-blue-900",
        desc: "text-blue-700/60",
        icon: "text-blue-400",
      },
      red: {
        title: "text-red-600",
        bg: "bg-red-50/60",
        border: "border-red-200",
        hover: "hover:bg-red-100 hover:border-red-300",
        text: "text-red-900",
        desc: "text-red-700/60",
        icon: "text-red-400",
      },
      emerald: {
        title: "text-emerald-600",
        bg: "bg-emerald-50/60",
        border: "border-emerald-100",
        hover: "hover:bg-emerald-100 hover:border-emerald-300",
        text: "text-emerald-900",
        desc: "text-emerald-700/60",
        icon: "text-emerald-400",
      },
      purple: {
        title: "text-purple-600",
        bg: "bg-purple-50/60",
        border: "border-purple-100",
        hover: "hover:bg-purple-100 hover:border-purple-300",
        text: "text-purple-900",
        desc: "text-purple-700/60",
        icon: "text-purple-400",
      },
    };

    const style = colors[color];

    return (
      <div>
        <h3 className={`font-heading-alt text-sm uppercase tracking-wide mb-2 ${style.title}`}>
          {title}
        </h3>
        <div className="space-y-2">
          {filtered.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block ${style.bg} border ${style.border} rounded-lg p-3 ${style.hover} transition-colors`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-heading-alt ${style.text}`}>{link.title}</span>
                <span className={style.icon}>{icon}</span>
              </div>
              {link.description && (
                <p className={`font-body text-xs ${style.desc}`}>{link.description}</p>
              )}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pr-2">
      <h2 className="font-heading-alt text-xl text-amber-900 mb-4">🔗 Quick Links</h2>

      <div className="space-y-6">
        {renderLinkGroup("Official Resources", "official", "amber")}
        {renderLinkGroup("Local Resources", "local", "emerald")}
        {renderLinkGroup("Online Meetings", "online", "blue")}
        {renderLinkGroup("Crisis Hotlines", "crisis", "red", "📞")}
        {renderLinkGroup("Treatment & Housing", "treatment", "purple")}
        {renderLinkGroup("Other Resources", "harm-reduction", "amber")}
      </div>
    </div>
  );
}

// ====== PRAYERS SECTION ======
function PrayersSection() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function fetchPrayers() {
      try {
        const data = await getAllPrayers(false);
        setPrayers(data);
      } catch (error) {
        logger.error("Failed to load prayers", { error });
      } finally {
        setLoading(false);
      }
    }
    fetchPrayers();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-purple-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading prayers...
      </div>
    );
  }

  const filtered =
    activeCategory === "all" ? prayers : prayers.filter((p) => p.category === activeCategory);

  // Get unique categories from data
  const categories = ["all", ...Array.from(new Set(prayers.map((p) => p.category)))];

  return (
    <div className="flex-1 overflow-y-auto pr-2">
      <h2 className="font-heading-alt text-xl text-amber-900 mb-3">🙏 Prayers</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-body capitalize ${
              activeCategory === cat
                ? "bg-purple-500 text-white"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prayer cards */}
      <div className="space-y-4">
        {filtered.map((prayer) => (
          <div key={prayer.id} className="bg-white/70 border border-purple-100 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-heading-alt text-purple-900">{prayer.title}</h3>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded capitalize">
                {prayer.category}
              </span>
            </div>
            <p className="font-handlee text-purple-800/80 leading-relaxed whitespace-pre-line">
              {prayer.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
