type LogLevel = "debug" | "info" | "warn" | "error"

function formatContext(scope: string, message: string, details?: unknown): string {
  if (details === undefined) {
    return `[${scope}] ${message}`
  }

  return `[${scope}] ${message} ${JSON.stringify(details)}`
}

function write(level: LogLevel, scope: string, message: string, details?: unknown) {
  const line = formatContext(scope, message, details)

  if (level === "error") {
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  if (level === "debug") {
    console.debug(line)
    return
  }

  console.info(line)
}

export function createLogger(scope: string) {
  return {
    debug(message: string, details?: unknown) {
      write("debug", scope, message, details)
    },
    info(message: string, details?: unknown) {
      write("info", scope, message, details)
    },
    warn(message: string, details?: unknown) {
      write("warn", scope, message, details)
    },
    error(message: string, details?: unknown) {
      write("error", scope, message, details)
    },
  }
}