"use client";

import { CelebrationEvent, PARTICLE_COUNTS } from "./types";
import { ConfettiBurst } from "./confetti-burst";
import { SuccessPulse } from "./success-pulse";
import { MilestoneModal } from "./milestone-modal";
import { FireworkBurst } from "./firework-burst";
import { CheckCircle2, Heart, Sparkles, Star } from "lucide-react";

interface CelebrationOverlayProps {
  event: CelebrationEvent;
  onClose: () => void;
}

export function CelebrationOverlay({ event, onClose }: CelebrationOverlayProps) {
  const { type, intensity, message, daysClean } = event;

  // Determine which icon to use for subtle celebrations
  const getIcon = () => {
    switch (type) {
      case "daily-complete":
        return <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 text-white" />;
      case "halt-check":
        return <Heart className="w-16 h-16 md:w-24 md:h-24 text-white" />;
      case "meeting-attended":
        return <Star className="w-16 h-16 md:w-24 md:h-24 text-white" />;
      case "inventory-complete":
        return <Sparkles className="w-16 h-16 md:w-24 md:h-24 text-white" />;
      default:
        return <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 text-white" />;
    }
  };

  // Subtle intensity: Success pulse only
  if (intensity === "subtle") {
    return <SuccessPulse message={message} icon={getIcon()} color="#10b981" />;
  }

  // Medium intensity: Confetti burst
  if (intensity === "medium") {
    return (
      <>
        <ConfettiBurst intensity={PARTICLE_COUNTS.medium} duration={4} />
        <SuccessPulse message={message} icon={getIcon()} color="#3b82f6" />
      </>
    );
  }

  // High intensity: Confetti + Modal (+ Fireworks for year milestone)
  const isYearMilestone = type === "one-year" || (daysClean && daysClean >= 365);

  return (
    <>
      {/* Confetti for all high-intensity celebrations */}
      <ConfettiBurst intensity={PARTICLE_COUNTS.high} duration={5} />

      {/* Fireworks for year milestones */}
      {isYearMilestone && <FireworkBurst count={5} />}

      {/* Modal */}
      <MilestoneModal
        isOpen={true}
        title={
          type === "one-year" ? "1 Year Clean!" : daysClean ? `${daysClean} Days!` : "Milestone!"
        }
        message={message || "Amazing achievement!"}
        daysClean={daysClean}
        onClose={onClose}
        intensity={intensity}
      />
    </>
  );
}
