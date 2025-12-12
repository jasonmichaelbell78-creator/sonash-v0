"use client"

import { useState, useEffect, useCallback } from "react"
import { type Coordinates } from "@/lib/utils/distance"

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "error"

export interface GeolocationState {
  /** User's current coordinates (null if not available) */
  coordinates: Coordinates | null
  /** Current status of geolocation permission/request */
  status: GeolocationStatus
  /** Error message if status is "error" or "denied" */
  error: string | null
  /** Whether coordinates are currently being fetched */
  loading: boolean
  /** Timestamp of last successful location update */
  lastUpdated: number | null
}

export interface UseGeolocationOptions {
  /** Whether to request location immediately on mount (default: false) */
  requestOnMount?: boolean
  /** Enable high accuracy mode - uses GPS if available (default: false) */
  enableHighAccuracy?: boolean
  /** Maximum age of cached position in milliseconds (default: 5 minutes) */
  maximumAge?: number
  /** Timeout for location request in milliseconds (default: 10 seconds) */
  timeout?: number
}

const DEFAULT_OPTIONS: UseGeolocationOptions = {
  requestOnMount: false,
  enableHighAccuracy: false,
  maximumAge: 5 * 60 * 1000, // 5 minutes - avoid repeated permission prompts
  timeout: 10000, // 10 seconds
}

/**
 * React hook for browser geolocation with permission handling
 *
 * Features:
 * - Permission-aware (checks before prompting)
 * - Caches location to avoid repeated permission prompts
 * - Handles errors gracefully with user-friendly messages
 * - Works on HTTPS only (required by browsers)
 *
 * @param options - Configuration options
 * @returns Geolocation state and request function
 *
 * @example
 * const { coordinates, status, requestLocation } = useGeolocation()
 *
 * // Request location on button click
 * <button onClick={requestLocation}>Find nearest meetings</button>
 *
 * // Use coordinates when available
 * if (coordinates) {
 *   const sorted = sortByDistance(meetings, coordinates, m => m.coordinates)
 * }
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    status: "idle",
    error: null,
    loading: false,
    lastUpdated: null,
  })

  // Check if geolocation is available in this browser
  const isAvailable = typeof window !== "undefined" && "geolocation" in navigator

  /**
   * Request the user's location
   * Will prompt for permission if not already granted
   */
  const requestLocation = useCallback(() => {
    if (!isAvailable) {
      setState((prev) => ({
        ...prev,
        status: "unavailable",
        error: "Geolocation is not supported by your browser",
        loading: false,
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      status: "requesting",
      loading: true,
      error: null,
    }))

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        setState({
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          status: "granted",
          error: null,
          loading: false,
          lastUpdated: Date.now(),
        })
      },
      // Error callback
      (error) => {
        let status: GeolocationStatus = "error"
        let errorMessage = "Unable to retrieve your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = "denied"
            errorMessage = "Location access was denied. Please enable location in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again."
            break
        }

        setState((prev) => ({
          ...prev,
          status,
          error: errorMessage,
          loading: false,
        }))
      },
      // Options
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        maximumAge: opts.maximumAge,
        timeout: opts.timeout,
      }
    )
  }, [isAvailable, opts.enableHighAccuracy, opts.maximumAge, opts.timeout])

  /**
   * Clear the current location and reset to idle state
   */
  const clearLocation = useCallback(() => {
    setState({
      coordinates: null,
      status: "idle",
      error: null,
      loading: false,
      lastUpdated: null,
    })
  }, [])

  // Request on mount if option is enabled
  useEffect(() => {
    if (opts.requestOnMount && isAvailable) {
      requestLocation()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    requestLocation,
    clearLocation,
    isAvailable,
  }
}
