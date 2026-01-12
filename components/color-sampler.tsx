"use client";

import { useState } from "react";
import Image from "next/image";

const textColors = [
  { name: "Current Dark Brown", hex: "#3d2914", highlight: "rgba(180,160,140,0.3)" },
  { name: "Medium Brown", hex: "#5a4230", highlight: "rgba(200,180,160,0.3)" },
  { name: "Warm Bronze", hex: "#6b5344", highlight: "rgba(210,190,170,0.3)" },
  { name: "Charcoal", hex: "#2d3436", highlight: "rgba(150,150,150,0.3)" },
  { name: "Deep Navy", hex: "#1a2634", highlight: "rgba(100,120,140,0.3)" },
  { name: "Copper", hex: "#7d5a4a", highlight: "rgba(220,200,180,0.3)" },
  { name: "Espresso", hex: "#4a3728", highlight: "rgba(190,170,150,0.3)" },
  { name: "Gold-Brown", hex: "#8b7355", highlight: "rgba(230,210,190,0.3)" },
  { name: "Terracotta", hex: "#8b5a42", highlight: "rgba(220,190,170,0.3)" },
  { name: "Slate", hex: "#4a5568", highlight: "rgba(160,170,180,0.3)" },
  { name: "Light Tan", hex: "#c9b896", highlight: "rgba(245,240,230,0.4)" },
  { name: "Champagne", hex: "#d4c8b0", highlight: "rgba(255,250,240,0.5)" },
  { name: "Silver", hex: "#c0b8ac", highlight: "rgba(240,240,240,0.5)" },
  { name: "Ivory", hex: "#ded5c4", highlight: "rgba(255,255,250,0.5)" },
  { name: "Antique White", hex: "#e8dcc8", highlight: "rgba(255,255,255,0.5)" },
  { name: "Pearl", hex: "#e0d8cc", highlight: "rgba(255,255,255,0.5)" },
  { name: "Warm White", hex: "#f0e8dc", highlight: "rgba(255,255,255,0.6)" },
  { name: "Off-White/Cream", hex: "#f5f0e6", highlight: "rgba(255,255,255,0.6)" },
];

export default function ColorSampler() {
  const [selectedColor, setSelectedColor] = useState(textColors[0]);

  return (
    <div className="min-h-screen bg-stone-800 p-8 flex gap-8">
      {/* Color selection panel */}
      <div className="w-80 flex-shrink-0 bg-stone-900 rounded-xl p-6 h-fit">
        <h2 className="text-white text-xl font-bold mb-4">Text Color Options</h2>
        <p className="text-stone-400 text-sm mb-6">Click a color to preview it on the notebook</p>

        <div className="flex flex-col gap-3">
          {textColors.map((color) => (
            <button
              key={color.hex}
              onClick={() => setSelectedColor(color)}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                selectedColor.hex === color.hex
                  ? "bg-stone-700 ring-2 ring-amber-500"
                  : "bg-stone-800 hover:bg-stone-700"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg border-2 border-stone-600"
                style={{ backgroundColor: color.hex }}
              />
              <div className="text-left">
                <p className="text-white font-medium">{color.name}</p>
                <p className="text-stone-400 text-xs font-mono">{color.hex}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative" style={{ width: "500px", height: "700px" }}>
          <Image
            src="/images/notebook-cover-blank.png"
            alt="Notebook preview"
            fill
            sizes="500px"
            className="object-contain"
            style={{
              filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))",
            }}
          />

          <div
            className="absolute inset-0 flex flex-col items-center pointer-events-none"
            style={{
              paddingTop: "8%",
              paddingBottom: "8%",
              paddingLeft: "18%",
              paddingRight: "18%",
            }}
          >
            {/* SoNash branding */}
            <div className="flex flex-col items-center">
              <h1
                className="font-rocksalt text-xl leading-tight text-center"
                style={{
                  color: selectedColor.hex,
                  textShadow: `
                    1px 1px 0px rgba(0,0,0,0.5),
                    2px 2px 3px rgba(0,0,0,0.3),
                    -1px -1px 0px ${selectedColor.highlight}
                  `,
                }}
              >
                SoNash
              </h1>

              <p
                className="font-shortstack text-sm tracking-wide mt-1"
                style={{
                  color: selectedColor.hex,
                  textShadow: `
                    1px 1px 0px rgba(0,0,0,0.4),
                    2px 2px 2px rgba(0,0,0,0.25),
                    -1px -1px 0px ${selectedColor.highlight}
                  `,
                }}
              >
                Sober Nashville
              </p>
            </div>

            {/* Recovery Notebook */}
            <div className="flex flex-col items-center mt-auto" style={{ marginLeft: "-1%" }}>
              <h2
                className="font-rocksalt text-base leading-relaxed text-center"
                style={{
                  color: selectedColor.hex,
                  textShadow: `
                    1px 1px 0px rgba(0,0,0,0.5),
                    2px 2px 3px rgba(0,0,0,0.3),
                    -1px -1px 0px ${selectedColor.highlight}
                  `,
                }}
              >
                Alex's
                <br />
                Recovery Notebook
              </h2>
            </div>

            {/* Clean days */}
            <div className="flex flex-col items-center mt-auto">
              <p
                className="font-shortstack text-xs text-center leading-snug"
                style={{
                  color: selectedColor.hex,
                  textShadow: `
                    1px 1px 0px rgba(0,0,0,0.4),
                    2px 2px 2px rgba(0,0,0,0.25),
                    -1px -1px 0px ${selectedColor.highlight}
                  `,
                }}
              >
                You've been clean
                <br />
                for 37 days.
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 mt-auto">
              <p
                className="font-shortstack text-xs"
                style={{
                  color: selectedColor.hex,
                  textShadow: `
                    1px 1px 0px rgba(0,0,0,0.4),
                    2px 2px 2px rgba(0,0,0,0.25),
                    -1px -1px 0px ${selectedColor.highlight}
                  `,
                }}
              >
                Turn to Today's Page →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
