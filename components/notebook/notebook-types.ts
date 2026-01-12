import React from "react";

export type NotebookModuleId =
  | "today"
  | "resources"
  | "growth"
  | "library"
  | "work"
  | "more"
  | "history"
  | "community"
  | "support";

export interface NotebookModule {
  id: NotebookModuleId;
  label: string;
  color: string;
  status: "available" | "planned";
  featureFlag?: string;
  description: string;
  render: (props: { nickname?: string; onNavigate?: (id: string) => void }) => React.ReactNode;
}
