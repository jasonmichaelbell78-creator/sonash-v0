"use client";

interface CheckInProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ id: string; label: string; completed: boolean }>;
}

export function CheckInProgress({
  currentStep,
  totalSteps,
  steps,
}: Readonly<CheckInProgressProps>) {
  return (
    <div className="mb-6 bg-amber-50/50 border border-amber-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-body text-amber-900/70">Check-in Progress</span>
        <span className="text-sm font-body font-bold text-amber-900">
          {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-amber-100 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${(() => {
                if (step.completed) return "bg-green-500 text-white scale-110";
                if (index < currentStep) return "bg-amber-400 text-white";
                return "bg-amber-100 text-amber-400";
              })()}`}
            >
              {step.completed ? "✓" : index + 1}
            </div>
            <span className="text-xs text-amber-900/60 mt-1 text-center">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
