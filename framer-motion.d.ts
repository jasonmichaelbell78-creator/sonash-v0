/**
 * Type augmentation for framer-motion v12 + React 19
 *
 * framer-motion 12.x types don't fully support React 19's updated
 * IntrinsicAttributes. This augmentation ensures motion components
 * accept their full prop set without TypeScript rejecting standard
 * motion props (initial, animate, exit, transition, variants, etc.).
 */

import "framer-motion";

declare module "framer-motion" {
  export interface MotionProps {
    initial?: boolean | Target | VariantLabels;
    animate?: AnimationControls | TargetAndTransition | VariantLabels | boolean;
    exit?: TargetAndTransition | VariantLabels;
    transition?: Transition;
    variants?: Variants;
    layout?: boolean | "position" | "size" | "preserve-aspect";
    layoutId?: string;
    whileHover?: VariantLabels | TargetAndTransition;
    whileTap?: VariantLabels | TargetAndTransition;
    whileFocus?: VariantLabels | TargetAndTransition;
    whileDrag?: VariantLabels | TargetAndTransition;
    whileInView?: VariantLabels | TargetAndTransition;
  }
}
