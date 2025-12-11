export type LogContext = Record<string, unknown>

type LogLevel = "info" | "warn" | "error"

const SENSITIVE_KEYS = ["token", "authorization", "password", "uid", "email", "auth", "idToken", "accessToken", "refreshToken"]

const redactValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value
  if (value instanceof Error) {
    return { name: value.name, message: value.message }
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item))
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, val]) => {
      acc[key] = SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))
        ? "[REDACTED]"
        : redactValue(val)
      return acc
    }, {})
  }

  if (typeof value === "string") {
    return value.length > 12 ? `${value.slice(0, 4)}…[REDACTED]` : "[REDACTED]"
  }

  return value
}

const sanitizeContext = (context?: LogContext) => {
  if (!context) return undefined
  return Object.entries(context).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = redactValue(value)
    return acc
  }, {})
}

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const payload: Record<string, unknown> = {
    level,
    message,
    ...(
      context
        ? {
            context: sanitizeContext(context),
          }
        : {}
    ),
  }

  if (level === "info") {
    console.log(payload)
  } else if (level === "warn") {
    console.warn(payload)
  } else {
    console.error(payload)
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
}

export const maskIdentifier = (value: string | null | undefined) => {
  if (!value) return "[unknown]"
  return value.length > 6 ? `${value.slice(0, 3)}…${value.slice(-2)}` : value
}
