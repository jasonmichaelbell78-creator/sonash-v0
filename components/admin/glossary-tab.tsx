"use client";

/**
 * Glossary Tab - Admin CRUD for recovery glossary terms
 */

import { AdminCrudTable } from "./admin-crud-table";
import { AdminCrudConfig } from "./admin-crud-types";
import { GlossaryTerm, GlossaryService } from "@/lib/db/glossary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Book } from "lucide-react";
import { glossaryData } from "@/data/glossary";

// Seed from static data file
async function seedGlossary() {
  try {
    for (const item of glossaryData) {
      await GlossaryService.addTerm({
        term: item.term,
        definition: item.definition,
        category: item.category,
      });
    }
  } catch (error) {
    console.error("Failed to seed glossary:", error);
    throw error;
  }
}

// Form component
function GlossaryForm({
  formData,
  setFormData,
}: Readonly<{
  formData: Partial<GlossaryTerm>;
  setFormData: (data: Partial<GlossaryTerm>) => void;
}>) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Term</Label>
        <Input
          value={formData.term || ""}
          onChange={(e) => setFormData({ ...formData, term: e.target.value })}
          className="bg-white"
          placeholder="HALT, Big Book, etc."
        />
      </div>
      <div className="space-y-2">
        <Label>Definition</Label>
        <Textarea
          value={formData.definition || ""}
          onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
          className="bg-white"
          placeholder="The meaning of this term..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <select
          value={formData.category || "culture"}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value as GlossaryTerm["category"] })
          }
          className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm"
        >
          <option value="acronyms">Acronyms</option>
          <option value="clinical">Clinical</option>
          <option value="culture">Culture</option>
          <option value="slang">Slang</option>
        </select>
      </div>
    </div>
  );
}

// Adapter to match CrudService interface
const glossaryServiceAdapter = {
  getAll: () => GlossaryService.getAllTerms(),
  add: (data: Omit<GlossaryTerm, "id">) => GlossaryService.addTerm(data).then(() => {}),
  update: (id: string, data: Partial<GlossaryTerm>) => GlossaryService.updateTerm(id, data),
  delete: (id: string) => GlossaryService.deleteTerm(id),
};

// Category badge colors
const categoryColors: Record<string, string> = {
  acronyms: "bg-blue-100 text-blue-700",
  clinical: "bg-green-100 text-green-700",
  culture: "bg-amber-100 text-amber-700",
  slang: "bg-purple-100 text-purple-700",
};

// Configuration
const glossaryConfig: AdminCrudConfig<GlossaryTerm> = {
  entityName: "Term",
  entityNamePlural: "Glossary Terms",
  tabId: "glossary",

  service: glossaryServiceAdapter,

  columns: [
    {
      key: "term",
      label: "Term",
      render: (item) => (
        <div className="flex gap-3">
          <Book className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-heading text-lg text-gray-900">{item.term}</p>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.definition}</p>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium capitalize ${categoryColors[item.category] || categoryColors.culture}`}
            >
              {item.category}
            </span>
          </div>
        </div>
      ),
    },
  ],

  searchFields: ["term", "definition"],

  FormComponent: GlossaryForm,

  emptyFormData: {
    term: "",
    definition: "",
    category: "culture",
  },

  showResetButton: true,
  resetData: seedGlossary,

  validateForm: (data) => {
    if (!data.term) return "Term is required";
    if (!data.definition) return "Definition is required";
    return null;
  },
};

export function GlossaryTab() {
  return <AdminCrudTable config={glossaryConfig} />;
}
