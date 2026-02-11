import * as React from "react";
import {
  JournalEntry,
  MoodEntry,
  GratitudeEntry,
  InventoryEntry,
  NoteEntry,
  SpotCheckEntry,
  DailyLogEntry,
} from "@/types/journal";
import { X } from "lucide-react";

interface EntryDetailDialogProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

// Type-specific detail view components
function MoodDetailView({ data }: Readonly<{ data: MoodEntry["data"] }>) {
  return (
    <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center">
      <span className="text-4xl block mb-2">{data?.mood ?? "😐"}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        Feeling (Intensity: {data?.intensity ?? 5}/10)
      </span>
      {data?.note && <p className="mt-2 text-sm text-slate-600">{data.note}</p>}
    </div>
  );
}

function GratitudeDetailView({ data }: Readonly<{ data: GratitudeEntry["data"] }>) {
  if (!data?.items) return null;
  return (
    <div>
      <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
      <ul className="list-disc pl-5">
        {data.items.map((item: string, i: number) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function InventoryDetailView({ data }: Readonly<{ data: InventoryEntry["data"] }>) {
  return (
    <div className="space-y-4">
      <div>
        <span className="font-bold">Resentments:</span> {data?.resentments ?? "N/A"}
      </div>
      <div>
        <span className="font-bold">Dishonesty:</span> {data?.dishonesty ?? "N/A"}
      </div>
      <div>
        <span className="font-bold">Apologies:</span> {data?.apologies ?? "N/A"}
      </div>
      <div>
        <span className="font-bold">Successes:</span> {data?.successes ?? "N/A"}
      </div>
    </div>
  );
}

function NoteDetailView({ data }: Readonly<{ data: NoteEntry["data"] }>) {
  return (
    <>
      {data?.title && <h4 className="font-bold text-xl mb-2 font-heading">{data.title}</h4>}
      {data?.content ?? ""}
    </>
  );
}

function SpotCheckDetailView({ data }: Readonly<{ data: SpotCheckEntry["data"] }>) {
  return (
    <div className="space-y-2">
      <div>
        <span className="font-bold">Feelings:</span> {data?.feelings?.join(", ") ?? "N/A"}
      </div>
      <div>
        <span className="font-bold">Absolutes:</span> {data?.absolutes?.join(", ") ?? "N/A"}
      </div>
      {data?.action && (
        <div>
          <span className="font-bold">Action:</span> {data.action}
        </div>
      )}
    </div>
  );
}

/**
 * Format boolean/null value for display
 */
function formatYesNoNull(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  return value ? "yes" : "no";
}

function DailyLogDetailView({ data }: Readonly<{ data: DailyLogEntry["data"] }>) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-widest text-slate-500 font-bold">
        <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
          Mood: {data.mood || "n/a"}
        </span>
        <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
          Cravings: {formatYesNoNull(data.cravings)}
        </span>
        <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
          Used: {formatYesNoNull(data.used)}
        </span>
      </div>
      {data.note && (
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-handlee text-lg">
          {data.note}
        </p>
      )}
    </div>
  );
}

function Step1WorksheetDetailView({ data }: Readonly<{ data: JournalEntry["data"] }>) {
  const worksheetData = data as unknown as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
        <h4 className="font-bold text-green-900 mb-2">📗 Step 1 Worksheet</h4>
        <p className="text-sm text-green-800">Powerlessness • Unmanageability • Acceptance</p>
      </div>

      <Step1Concept1Section data={worksheetData} />
      <Step1Concept2Section data={worksheetData} />
      <Step1Concept3Section data={worksheetData} />
      <Step1ConclusionsSection data={worksheetData} />
    </div>
  );
}

// Concept sections for Step 1 worksheet
function Step1Concept1Section({ data }: Readonly<{ data: Record<string, unknown> }>) {
  return (
    <div className="space-y-3">
      <h5 className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-200 pb-1">
        Concept 1: Powerlessness over Amount
      </h5>
      {renderWorksheetField(
        data,
        "concept1_q1_examples",
        "concept1_q1_results",
        "1.1 Tried to stop drinking/drugging"
      )}
      {renderWorksheetField(
        data,
        "concept1_q2_examples",
        "concept1_q2_results",
        "1.2 Tried to limit/control by dosage"
      )}
      {renderWorksheetField(
        data,
        "concept1_q3_examples",
        "concept1_q3_results",
        "1.3 Tried to limit by switching drinks"
      )}
      {renderWorksheetField(
        data,
        "concept1_q4_examples",
        "concept1_q4_results",
        "1.4 Tried to limit by time restrictions"
      )}
      {renderWorksheetArray(data, "concept1_q5", "1.5 Blackouts/memory loss")}
    </div>
  );
}

function Step1Concept2Section({ data }: Readonly<{ data: Record<string, unknown> }>) {
  return (
    <div className="space-y-3">
      <h5 className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-200 pb-1">
        Concept 2: Powerlessness over Bad Results
      </h5>
      {renderWorksheetField(
        data,
        "concept2_q1_examples",
        "concept2_q1_results",
        "2.1 Tried to drink without bad results"
      )}
      {renderWorksheetField(
        data,
        "concept2_q2_examples",
        "concept2_q2_results",
        "2.2 Tried to limit health effects"
      )}
      {renderWorksheetField(
        data,
        "concept2_q3_examples",
        "concept2_q3_results",
        "2.3 Other control attempts"
      )}
    </div>
  );
}

function Step1Concept3Section({ data }: Readonly<{ data: Record<string, unknown> }>) {
  return (
    <div className="space-y-3">
      <h5 className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-200 pb-1">
        Concept 3: Unmanageability
      </h5>
      {renderWorksheetArray(data, "concept3_q1", "3.1 What brought me to AA")}
      {renderWorksheetArray(data, "concept3_q2", "3.2 Crisis that would have occurred")}
      {renderWorksheetArray(data, "concept3_q3", "3.3 Effect on self-esteem")}
      {renderWorksheetArray(data, "concept3_q4", "3.4 Physical fights")}
      {renderWorksheetArray(data, "concept3_q5", "3.5 Lost job/promotion")}
      {renderWorksheetArray(data, "concept3_q6", "3.6 Lost relationships")}
      {renderWorksheetArray(data, "concept3_q7", "3.7 Hospitalizations")}
      {renderWorksheetArray(data, "concept3_q8", "3.8 Depression/suicide")}
      {renderWorksheetArray(data, "concept3_q9", "3.9 Effect on life goals")}
      {renderWorksheetArray(data, "concept3_q10", "3.10 Health effects")}
      {renderWorksheetArray(data, "concept3_q11", "3.11 Danger to life")}
      {renderWorksheetArray(data, "concept3_q12", "3.12 Objections from loved ones")}
      {renderWorksheetArray(data, "concept3_q13", "3.13 Physical abuse")}
      {renderWorksheetArray(data, "concept3_q14", "3.14 Effects while sober")}
    </div>
  );
}

function Step1ConclusionsSection({ data }: Readonly<{ data: Record<string, unknown> }>) {
  return (
    <div className="space-y-3">
      <h5 className="font-bold text-amber-900 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
        Conclusions
      </h5>
      {renderWorksheetArray(data, "conclusion_q1", "4.1 Why I can't use safely")}
      {renderWorksheetString(data, "conclusion_q2", "4.2 Admitting vs accepting")}
      {renderWorksheetString(data, "conclusion_q3", "4.3 Am I an alcoholic?")}
      {renderWorksheetArray(data, "conclusion_q4", "4.4 Reasons to continue in AA")}
    </div>
  );
}

/**
 * Render entry detail content based on type
 */
function EntryDetailContent({ entry }: Readonly<{ entry: JournalEntry }>) {
  switch (entry.type) {
    case "mood":
      return entry.data ? <MoodDetailView data={entry.data} /> : null;
    case "gratitude":
      return <GratitudeDetailView data={entry.data} />;
    case "inventory":
      return entry.data ? <InventoryDetailView data={entry.data} /> : null;
    case "free-write":
    case "meeting-note":
      return entry.data ? <NoteDetailView data={entry.data} /> : null;
    case "spot-check":
      return entry.data ? <SpotCheckDetailView data={entry.data} /> : null;
    case "daily-log":
      return <DailyLogDetailView data={entry.data} />;
    case "step-1-worksheet":
      return entry.data ? <Step1WorksheetDetailView data={entry.data} /> : null;
    default:
      return null;
  }
}

export function EntryDetailDialog({ entry, onClose }: EntryDetailDialogProps) {
  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 capitalize">
              {entry.type.replace("-", " ")}
            </h3>
            <p className="text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-handlee text-lg">
          <EntryDetailContent entry={entry} />
        </div>
      </div>
    </div>
  );
}

// Helper functions for rendering Step 1 Worksheet data
function renderWorksheetField(
  data: Record<string, unknown>,
  examplesKey: string,
  resultsKey: string,
  label: string
) {
  // Runtime type guards to validate data
  const examplesRaw = data[examplesKey];
  const resultsRaw = data[resultsKey];

  const examples =
    Array.isArray(examplesRaw) && examplesRaw.every((item) => typeof item === "string")
      ? (examplesRaw as string[])
      : [];
  const results =
    Array.isArray(resultsRaw) && resultsRaw.every((item) => typeof item === "string")
      ? (resultsRaw as string[])
      : [];

  // Handle mismatched array lengths by using the longer one
  const maxLength = Math.max(examples.length, results.length);
  if (maxLength === 0) return null;

  // Check if there's any actual content
  const contentExists = Array.from({ length: maxLength }).some(
    (_, i) => examples[i]?.trim() || results[i]?.trim()
  );
  if (!contentExists) return null;

  return (
    <div className="text-sm pl-3 border-l-2 border-slate-200">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {Array.from({ length: maxLength }).map((_, i) => {
        const example = examples[i];
        const result = results[i];

        if (!example?.trim() && !result?.trim()) {
          return null;
        }

        return (
          <div key={`example-result-${i}`} className="ml-2 mb-2 text-xs">
            {example?.trim() && (
              <p className="text-slate-600">
                <span className="font-semibold">Example:</span> {example}
              </p>
            )}
            {result?.trim() && (
              <p className="text-slate-500">
                <span className="font-semibold">Result:</span> {result}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderWorksheetArray(data: Record<string, unknown>, key: string, label: string) {
  // Runtime type guard to validate data is an array of strings
  const raw = data[key];
  const values =
    Array.isArray(raw) && raw.every((item) => typeof item === "string") ? (raw as string[]) : [];

  const filledValues = values.filter((v) => v.trim());
  if (filledValues.length === 0) return null;

  return (
    <div className="text-sm pl-3 border-l-2 border-slate-200">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {filledValues.map((value, i) => (
        <p key={i} className="ml-2 text-slate-600 text-xs mb-1">
          • {value}
        </p>
      ))}
    </div>
  );
}

function renderWorksheetString(data: Record<string, unknown>, key: string, label: string) {
  // Runtime type guard to validate data is a string
  const raw = data[key];
  const value = typeof raw === "string" ? raw : "";

  if (!value.trim()) return null;

  return (
    <div className="text-sm pl-3 border-l-2 border-slate-200">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="ml-2 text-slate-600 text-xs">{value}</p>
    </div>
  );
}
