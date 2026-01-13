/**
 * Lamp glow effect - pure presentational component.
 * Renders static gradient overlays for ambient lighting effect.
 *
 * @see CANON-0046: Removed unnecessary "use client" directive
 */
export default function LampGlow() {
  return (
    <>
      {/* Lamp light source in top-left corner */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(ellipse at center, rgba(255,235,180,0.25) 0%, rgba(255,220,150,0.1) 40%, transparent 70%)",
          zIndex: 1,
        }}
      />
      {/* Subtle warm overlay across scene */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,240,200,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
          zIndex: 1,
        }}
      />
    </>
  );
}
