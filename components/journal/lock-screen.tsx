import { Lock } from "lucide-react";

interface LockScreenProps {
  onUnlock?: () => void;
}

export function LockScreen({ onUnlock }: Readonly<LockScreenProps>) {
  return (
    <div className="min-h-screen bg-[#f0eadd] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Texture Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        <div className="w-24 h-24 bg-[var(--journal-ribbon-red)]/10 rounded-full flex items-center justify-center mx-auto border-4 border-[var(--journal-ribbon-red)]/20">
          <Lock className="w-10 h-10 text-[var(--journal-ribbon-red)]" />
        </div>

        <div className="space-y-4">
          <h1 className="font-heading text-4xl text-[var(--journal-text)]">Private Journal</h1>
          <p className="text-slate-600 font-handlee text-xl">
            This notebook is locked to protect your recovery story.
          </p>
        </div>

        {onUnlock && (
          <button
            onClick={onUnlock}
            className="px-8 py-3 bg-[var(--journal-ribbon-blue)] text-white font-bold rounded-lg shadow-lg hover:bg-[#2c3e50] transition-colors"
          >
            Unlock Pages
          </button>
        )}
      </div>
    </div>
  );
}
