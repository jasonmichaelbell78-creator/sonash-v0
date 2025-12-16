import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function featureFlagEnabled(featureId: string): boolean {
  // Always return true for now to enable all implemented features
  return true
}
