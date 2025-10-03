import { type Either, left, right } from "fp-ts/lib/Either.js"
import type { AdapterError } from "../types.ts"

type AcceptanceTestInfo = { id: string; description: string }

interface Adapter {
  parse: (raw: string) => Either<AdapterError, AcceptanceTestInfo[]>
}

/** Parse multiple lines of "AT-####: SOME DESCRIPTION" format */
class SimpleColonFormatAdapter implements Adapter {
  parse(raw: string): Either<AdapterError, AcceptanceTestInfo[]> {
    const lines = raw
      .trim()
      .split("\n")
      .filter((line: string) => line.length > 0)

    const malformedLineNumbers: number[] = []
    const validTests: AcceptanceTestInfo[] = []

    lines.forEach((line, i) => {
      const m = line.match(/^(AT-\d\d\d\d):\s*(.+)$/)
      if (!m || !m[1] || !m[2]) {
        malformedLineNumbers.push(i + 1) // 1-indexed line numbers
      } else {
        validTests.push({ id: m[1], description: m[2].trim() })
      }
    })

    return malformedLineNumbers.length > 0
      ? left({
          _tag: "adapter_error",
          adapter: "at-listing-tool",
          cause: `Malformed lines found at line numbers: ${malformedLineNumbers.join(", ")}`,
        })
      : right(validTests)
  }
}

const LIST_ATS_TOOL_ADAPTERS = {
  default: SimpleColonFormatAdapter,
  simple: SimpleColonFormatAdapter,
} as const

/**
 * Get an instance of the specified adapter
 * @param adapter - The adapter type to instantiate
 * @returns An instance of the specified adapter
 */
export function getInstance(adapter: keyof typeof LIST_ATS_TOOL_ADAPTERS): Adapter {
  return new LIST_ATS_TOOL_ADAPTERS[adapter]()
}
