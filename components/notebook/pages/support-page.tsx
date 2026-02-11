"use client";

import { useState } from "react";
import { Star, Heart, Briefcase } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  role: string;
  icon: typeof Star;
  tags: string[];
}

export default function SupportPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const contacts: Contact[] = [
    {
      id: "1",
      name: "Jordan",
      role: "Sponsor",
      icon: Star,
      tags: ["good in a crisis", "just to talk"],
    },
    {
      id: "2",
      name: "Maya",
      role: "Friend",
      icon: Heart,
      tags: ["rides", "just to talk"],
    },
    {
      id: "3",
      name: "Dr. Lopez",
      role: "Counselor",
      icon: Briefcase,
      tags: ["appointment scheduling", "just to talk"],
    },
  ];

  return (
    <div className="h-full overflow-y-auto pr-2">
      <h1 className="font-heading text-2xl text-amber-900 underline mb-2">My Support Circle</h1>
      <p className="font-body text-amber-900/70 mb-6">
        The people I reach out to when things get rough.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Contact list */}
        <div className="space-y-3">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors ${
                selectedContact?.id === contact.id ? "bg-amber-50" : ""
              }`}
              style={{ boxShadow: "1px 1px 4px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-start gap-3">
                <contact.icon className="w-6 h-6 text-amber-700/70 mt-0.5" />
                <div>
                  <h3 className="font-heading text-lg text-amber-900">
                    {contact.name} ({contact.role})
                  </h3>
                  <p className="font-body text-sm text-amber-900/60">{contact.tags.join(" · ")}</p>
                  <p className="font-body text-xs text-amber-900/40 mt-1">Tap to open details</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right column - Selected contact details or prompt */}
        <div>
          {selectedContact ? (
            <div>
              <h2 className="font-heading text-xl text-amber-900 mb-2">
                {selectedContact.name} – {selectedContact.role}
              </h2>
              <p className="font-body text-amber-900/70 mb-4">{selectedContact.tags.join(" · ")}</p>

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  className="flex-1 py-2 px-4 border border-amber-300 rounded font-body text-amber-900 hover:bg-amber-50 transition-colors"
                  style={{ boxShadow: "1px 1px 4px rgba(0,0,0,0.1)" }}
                >
                  Call
                </button>
                <button
                  className="flex-1 py-2 px-4 border border-amber-300 rounded font-body text-amber-900 hover:bg-amber-50 transition-colors"
                  style={{ boxShadow: "1px 1px 4px rgba(0,0,0,0.1)" }}
                >
                  Text
                </button>
                <button
                  className="flex-1 py-2 px-4 border border-amber-300 rounded font-body text-amber-900 hover:bg-amber-50 transition-colors"
                  style={{ boxShadow: "1px 1px 4px rgba(0,0,0,0.1)" }}
                >
                  Directions
                </button>
              </div>

              <p className="font-body text-sm text-amber-900/50 mb-6">One tap to reach out.</p>

              {/* Things to talk about */}
              <h3 className="font-heading text-lg text-amber-900 mb-2">
                Things I want to talk about
              </h3>
              <div className="space-y-1">
                <p className="font-body text-amber-900/70 italic">Ask about step work.</p>
                <p className="font-body text-amber-900/70 italic">Share how this week went.</p>
                {[...Array(3)].map((_, i) => (
                  <div key={`blank-line-${i}`} className="h-6 border-b border-amber-200/50" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="font-body text-amber-900/50 italic text-center">
                Tap a contact to see details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer message */}
      <p className="font-body text-sm text-amber-900/50 text-right mt-6 italic">
        You don't have to do this alone.
      </p>
    </div>
  );
}
