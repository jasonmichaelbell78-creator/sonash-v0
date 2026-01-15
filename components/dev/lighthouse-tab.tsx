"use client";

/**
 * LighthouseTab - Lighthouse Performance Scores Dashboard
 *
 * Displays:
 * - Current scores for all pages
 * - Historical trends (from Firestore)
 * - Regression alerts
 * - Links to full HTML reports
 */

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface LighthouseResult {
  route: string;
  url: string;
  scores: LighthouseScore;
  success: boolean;
}

interface LighthouseRun {
  timestamp: string;
  commit?: string;
  branch?: string;
  device: string;
  results: LighthouseResult[];
}

// Score color based on value
function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "bg-green-900/30";
  if (score >= 50) return "bg-yellow-900/30";
  return "bg-red-900/30";
}

// Score badge component
function ScoreBadge({ score, label }: { score: number; label: string }) {
  return (
    <div className={`text-center p-2 rounded ${getScoreBg(score)}`}>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

export function LighthouseTab() {
  const [latestRun, setLatestRun] = useState<LighthouseRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestRun() {
      try {
        const historyRef = collection(db, "dev", "lighthouse", "history");
        const q = query(historyRef, orderBy("timestamp", "desc"), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setLatestRun(null);
        } else {
          const doc = snapshot.docs[0];
          setLatestRun(doc.data() as LighthouseRun);
        }
      } catch (err) {
        // If collection doesn't exist yet, that's okay
        console.log("No Lighthouse data yet:", err);
        setLatestRun(null);
      } finally {
        setLoading(false);
      }
    }

    fetchLatestRun();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <div className="text-gray-400">Loading Lighthouse data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 rounded-lg p-8 text-center border border-red-700">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // No data yet - show setup instructions
  if (!latestRun) {
    return (
      <div className="space-y-6">
        {/* Setup Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🚀</span>
            <span>Lighthouse Setup Required</span>
          </h2>
          <p className="text-gray-400 mb-4">
            No Lighthouse data found. Run the audit script to generate initial scores.
          </p>

          <div className="bg-gray-900 rounded p-4 font-mono text-sm">
            <div className="text-gray-500"># Install dependencies (if not done)</div>
            <div className="text-green-400">npm run lighthouse</div>
            <div className="text-gray-500 mt-2"># Or run in CI to populate Firestore</div>
          </div>

          <div className="mt-6 p-4 bg-blue-900/30 rounded border border-blue-700">
            <h3 className="font-semibold text-blue-400 mb-2">Implementation Status</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✅ Dev Dashboard created</li>
              <li>✅ Lighthouse tab UI ready</li>
              <li>✅ PERF-001: Lighthouse script</li>
              <li>⏳ PERF-002: CI integration</li>
              <li>⏳ PERF-003: Firestore history storage</li>
            </ul>
          </div>
        </div>

        {/* Sample data preview */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 border-dashed opacity-60">
          <h3 className="text-lg font-semibold mb-4 text-gray-500">
            Preview: What you will see
          </h3>
          <SampleScoreTable />
        </div>
      </div>
    );
  }

  // Show actual data
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Latest Lighthouse Audit</h2>
          <div className="text-sm text-gray-400">
            {new Date(latestRun.timestamp).toLocaleString()}
            {latestRun.commit && (
              <span className="ml-2 font-mono text-xs bg-gray-700 px-2 py-0.5 rounded">
                {latestRun.commit.substring(0, 7)}
              </span>
            )}
          </div>
        </div>

        {/* Scores Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3 pr-4">Page</th>
                <th className="pb-3 px-4 text-center">Performance</th>
                <th className="pb-3 px-4 text-center">Accessibility</th>
                <th className="pb-3 px-4 text-center">Best Practices</th>
                <th className="pb-3 px-4 text-center">SEO</th>
                <th className="pb-3 px-4 text-center">PWA</th>
              </tr>
            </thead>
            <tbody>
              {latestRun.results.map((result) => (
                <tr key={result.route} className="border-b border-gray-700/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{result.route}</div>
                    <div className="text-xs text-gray-500">{result.url}</div>
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={result.scores.performance} label="Perf" />
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={result.scores.accessibility} label="A11y" />
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={result.scores.bestPractices} label="Best" />
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={result.scores.seo} label="SEO" />
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={result.scores.pwa} label="PWA" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Historical Trends</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          Chart coming in PERF-005 (after multiple CI runs populate history)
        </div>
      </div>
    </div>
  );
}

// Sample score table for preview
function SampleScoreTable() {
  const sampleData = [
    { route: "landing", perf: 85, a11y: 92, best: 95, seo: 90, pwa: 30 },
    { route: "today", perf: 78, a11y: 88, best: 90, seo: 85, pwa: 30 },
    { route: "journal", perf: 72, a11y: 85, best: 88, seo: 80, pwa: 30 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="pb-2 pr-4 text-left">Page</th>
            <th className="pb-2 px-2 text-center">Perf</th>
            <th className="pb-2 px-2 text-center">A11y</th>
            <th className="pb-2 px-2 text-center">Best</th>
            <th className="pb-2 px-2 text-center">SEO</th>
            <th className="pb-2 px-2 text-center">PWA</th>
          </tr>
        </thead>
        <tbody>
          {sampleData.map((row) => (
            <tr key={row.route} className="border-b border-gray-700/30">
              <td className="py-2 pr-4">{row.route}</td>
              <td className={`py-2 px-2 text-center ${getScoreColor(row.perf)}`}>
                {row.perf}
              </td>
              <td className={`py-2 px-2 text-center ${getScoreColor(row.a11y)}`}>
                {row.a11y}
              </td>
              <td className={`py-2 px-2 text-center ${getScoreColor(row.best)}`}>
                {row.best}
              </td>
              <td className={`py-2 px-2 text-center ${getScoreColor(row.seo)}`}>
                {row.seo}
              </td>
              <td className={`py-2 px-2 text-center ${getScoreColor(row.pwa)}`}>
                {row.pwa}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
