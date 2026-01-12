"use client"

import { useEffect, useMemo, useState } from "react"
import { getFunctions, httpsCallable } from "firebase/functions"
import { logger } from "@/lib/logger"
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SentryIssueSummary {
    title: string
    count: number
    lastSeen: string | null
    firstSeen: string | null
    shortId: string
    level: string | null
    status: string | null
    permalink: string
}

interface SentryErrorSummaryResponse {
    summary: {
        totalEvents24h: number
        totalEventsPrev24h: number
        trendPct: number
        issueCount: number
    }
    issues: SentryIssueSummary[]
    generatedAt: string
}

function redactSensitive(text: string) {
    const redactedEmail = text.replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[redacted-email]"
    )
    const redactedPhone = redactedEmail.replace(
        /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        "[redacted-phone]"
    )
    const redactedTokens = redactedPhone.replace(
        /\b[a-f0-9]{32,}\b/gi,
        "[redacted-token]"
    )
    return redactedTokens
}

export function ErrorsTab() {
    const [summary, setSummary] = useState<SentryErrorSummaryResponse["summary"] | null>(null)
    const [issues, setIssues] = useState<SentryIssueSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const trendDirection = useMemo(() => {
        if (!summary) return null
        if (summary.trendPct > 0) return "up"
        if (summary.trendPct < 0) return "down"
        return "flat"
    }, [summary])

    const refresh = async () => {
        setLoading(true)
        setError(null)

        try {
            const functions = getFunctions()
            const getSummary = httpsCallable<void, SentryErrorSummaryResponse>(functions, "adminGetSentryErrorSummary")
            const result = await getSummary()
            setSummary(result.data.summary)
            setIssues(result.data.issues)
        } catch (err) {
            logger.error("Failed to fetch Sentry summary", { error: err })
            setError(err instanceof Error ? err.message : "Failed to fetch Sentry summary")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <div>
                        <h2 className="text-lg font-semibold text-amber-900">Errors</h2>
                        <p className="text-sm text-amber-700">Sanitized Sentry error overview</p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
                    Loading error summary...
                </div>
            ) : summary ? (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-amber-100 bg-white p-4">
                            <p className="text-sm text-amber-700">Events (last 24h)</p>
                            <p className="text-2xl font-semibold text-amber-900">{summary.totalEvents24h.toLocaleString()}</p>
                            <p className="text-xs text-amber-600">Prev 24h: {summary.totalEventsPrev24h.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-white p-4">
                            <p className="text-sm text-amber-700">Trend vs prior 24h</p>
                            <div className="flex items-center gap-2">
                                {trendDirection === "up" && <TrendingUp className="h-5 w-5 text-red-500" />}
                                {trendDirection === "down" && <TrendingDown className="h-5 w-5 text-green-600" />}
                                {trendDirection === "flat" && <span className="text-sm text-amber-600">—</span>}
                                <p className="text-2xl font-semibold text-amber-900">
                                    {summary.trendPct.toFixed(1)}%
                                </p>
                            </div>
                            <p className="text-xs text-amber-600">Based on hourly Sentry events</p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-white p-4">
                            <p className="text-sm text-amber-700">Active issues (top 20)</p>
                            <p className="text-2xl font-semibold text-amber-900">{summary.issueCount}</p>
                            <p className="text-xs text-amber-600">Most frequent errors in last 24h</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-100 bg-white">
                        <div className="border-b border-amber-100 px-6 py-4">
                            <h3 className="text-sm font-semibold text-amber-900">Recent errors</h3>
                        </div>
                        {issues.length === 0 ? (
                            <div className="p-6 text-sm text-amber-700">No recent errors reported.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-amber-100 text-sm">
                                    <thead className="bg-amber-50 text-left text-amber-800">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Error</th>
                                            <th className="px-6 py-3 font-medium">Count</th>
                                            <th className="px-6 py-3 font-medium">Last seen</th>
                                            <th className="px-6 py-3 font-medium">Level</th>
                                            <th className="px-6 py-3 font-medium">Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100">
                                        {issues.map((issue) => (
                                            <tr key={issue.shortId}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-amber-900">{redactSensitive(issue.title)}</div>
                                                    <div className="text-xs text-amber-600">{issue.shortId}</div>
                                                </td>
                                                <td className="px-6 py-4 text-amber-900">{issue.count.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-amber-700">
                                                    {issue.lastSeen
                                                        ? formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true })
                                                        : "Unknown"}
                                                </td>
                                                <td className="px-6 py-4 text-amber-700">{issue.level || "unknown"}</td>
                                                <td className="px-6 py-4">
                                                    <a
                                                        href={issue.permalink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-amber-700 hover:text-amber-900 hover:underline"
                                                    >
                                                        View in Sentry
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
                    No summary available.
                </div>
            )}
        </div>
    )
}
