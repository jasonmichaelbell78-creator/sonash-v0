"use client"

import { useState, useEffect } from "react"
import { getFunctions, httpsCallable } from "firebase/functions"
import { Play, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Job {
  id: string
  name: string
  schedule: string
  description: string
  lastRunStatus: "success" | "failed" | "running" | "never"
  lastRun: string | null
  lastSuccessRun: string | null
  lastRunDuration: number | null
  lastError: string | null
}

export function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    setError(null)

    try {
      const functions = getFunctions()
      const getJobsFn = httpsCallable<void, { jobs: Job[] }>(functions, "adminGetJobsStatus")

      const result = await getJobsFn()
      setJobs(result.data.jobs)
    } catch (err) {
      console.error("Failed to load jobs:", err)
      setError(err instanceof Error ? err.message : "Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }

  async function triggerJob(jobId: string) {
    if (runningJobs.has(jobId)) return

    setRunningJobs(prev => new Set(prev).add(jobId))
    setError(null)

    try {
      const functions = getFunctions()
      const triggerFn = httpsCallable<{ jobId: string }, { success: boolean; message: string }>(
        functions,
        "adminTriggerJob"
      )

      const result = await triggerFn({ jobId })

      // Reload jobs to get updated status
      await loadJobs()

      alert(result.data.message)
    } catch (err) {
      console.error("Failed to trigger job:", err)
      setError(err instanceof Error ? err.message : "Failed to trigger job")
      alert(`Failed to trigger job: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setRunningJobs(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  function getStatusBadge(status: Job["lastRunStatus"]) {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Success
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      case "running":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Running
          </span>
        )
      case "never":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3" />
            Never Run
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-amber-600">Loading jobs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading text-amber-900">Background Jobs</h2>
          <p className="text-sm text-amber-600">Monitor and manage scheduled background tasks</p>
        </div>
        <button
          onClick={loadJobs}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid gap-4">
        {jobs.map((job) => {
          const isRunning = runningJobs.has(job.id)

          return (
            <div
              key={job.id}
              className="bg-white border border-amber-100 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-amber-900">{job.name}</h3>
                    {getStatusBadge(job.lastRunStatus)}
                  </div>

                  <p className="text-sm text-amber-600 mb-4">{job.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-amber-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Schedule</span>
                      </div>
                      <div className="text-amber-900">{job.schedule}</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-amber-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Last Run</span>
                      </div>
                      <div className="text-amber-900">
                        {job.lastRun ? formatDistanceToNow(new Date(job.lastRun), { addSuffix: true }) : "Never"}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-amber-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Last Success</span>
                      </div>
                      <div className="text-amber-900">
                        {job.lastSuccessRun ? formatDistanceToNow(new Date(job.lastSuccessRun), { addSuffix: true }) : "Never"}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-amber-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <div className="text-amber-900">
                        {job.lastRunDuration ? `${job.lastRunDuration}ms` : "N/A"}
                      </div>
                    </div>
                  </div>

                  {job.lastError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium text-red-900 mb-1">Last Error:</div>
                      <div className="text-red-700 font-mono text-xs">{job.lastError}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => triggerJob(job.id)}
                  disabled={isRunning}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Run job manually"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="text-center p-12 border border-dashed border-amber-200 rounded-lg bg-amber-50/50">
          <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-amber-600">No background jobs configured</p>
        </div>
      )}
    </div>
  )
}
