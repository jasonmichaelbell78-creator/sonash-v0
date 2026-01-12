import LampGlow from "@/components/desktop/lamp-glow";
import HomeClient from "@/components/home/home-client";

/**
 * Landing page - Server Component with SSR-friendly static background.
 *
 * Architecture:
 * - Server Component: Static background (wood table, vignette, lamp glow)
 * - Client Component: Interactive book cover/notebook (HomeClient)
 *
 * This split enables:
 * - Faster FCP: Static HTML rendered server-side
 * - Better LCP: Background visible before JS hydrates
 * - Code organization: Interactive logic isolated in client component
 *
 * @see CANON-0045: SSR blocking fix
 * @see CANON-0033: Merged duplicate finding
 */
export default function Home() {
  return (
    <main className="fixed inset-0 overflow-y-auto overflow-x-hidden">
      {/* Wood table background - Server rendered for fast FCP */}
      <div
        className="fixed inset-0 min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/wood-table.jpg')`,
        }}
      />

      {/* Subtle vignette overlay for depth - Server rendered */}
      <div
        className="fixed inset-0 min-h-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      <LampGlow />

      {/* Client component for interactive parts */}
      <HomeClient />
    </main>
  );
}
