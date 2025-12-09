"use client"

import type React from "react"

interface NotebookPageProps {
  children: React.ReactNode
}

export default function NotebookPage({ children }: NotebookPageProps) {
  return <div className="h-full overflow-y-auto scrollbar-hide">{children}</div>
}
