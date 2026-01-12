"use client";

import * as React from "react";

interface JournalLayoutProps {
  children: React.ReactNode;
}

export function JournalLayout({ children }: JournalLayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#111] flex items-center justify-center p-4 md:p-8">
      {/* Notebook Container */}
      <div
        className="relative w-full max-w-4xl min-h-[85vh] flex rounded-r-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--journal-paper)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Leather Spine */}
        <div
          className="relative w-16 md:w-24 flex-shrink-0 z-10 flex flex-col items-center py-4"
          style={{
            backgroundColor: "var(--journal-spine)",
            backgroundImage: `
                            radial-gradient(circle at 50% 50%, transparent 80%, rgba(0,0,0,0.4) 100%),
                            var(--journal-spine-texture)
                        `,
            borderRight: "1px solid rgba(0,0,0,0.5)",
            boxShadow: "inset -2px 0 5px rgba(0,0,0,0.4)",
          }}
        >
          {/* Stitching effect */}
          <div
            className="absolute left-2 top-0 bottom-0 w-0 border-l-2 border-dashed border-[#e3decb]/20"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
            }}
          />
          <div
            className="absolute right-2 top-0 bottom-0 w-0 border-r-2 border-dashed border-[#e3decb]/20"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
            }}
          />

          {/* Spine Highlight/Shadow for roundness effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-white/5 to-black/40 pointer-events-none mix-blend-overlay" />
        </div>

        {/* Paper Content Area */}
        <div className="flex-1 relative flex flex-col">
          {/* Lined Paper Background Pattern */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `linear-gradient(var(--journal-line) 1px, transparent 1px)`,
              backgroundSize: "100% 2rem",
              marginTop: "4rem", // Start lines after header area ideally
            }}
          />

          {/* Paper Texture Overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Left shadow from spine */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />

          {/* Content */}
          <div className="relative z-10 flex-1 p-6 md:p-10 font-body text-[var(--journal-text)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
