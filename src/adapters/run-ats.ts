import { type AcceptanceTest, type AdapterError, type CommandReturn, type Either, right, type TestResult } from "../types.ts"

interface Adapter {
  parse: (tests: AcceptanceTest[], raw: CommandReturn) => Either<AdapterError, TestResult[]>
}

/** Parse TAP-flat format output and extract test results */
class TapFlatAdapter implements Adapter {
  private static readonly LINE_RE = /^(ok|not ok) \d+ - .*?\/(AT-\d+)\.test\.ts >/
  private static readonly IS_PLAN_RE = /^\d+\.\.\d+$/

  parse(tests: AcceptanceTest[], raw: CommandReturn): Either<AdapterError, TestResult[]> {
    const results: TestResult[] = []
    const state = { id: null, passed: null, output: [] }
    const lines = (raw.stdout + raw.stderr).split("\n")
    for (const rawLine of lines) this.processLine(rawLine, results, tests, state)

    this.flush(results, tests, state)

    return right(results)
  }

  private processLine(
    rawLine: string,
    results: TestResult[],
    tests: AcceptanceTest[],
    state: { id: string | null; passed: boolean | null; output: string[] },
  ): void {
    const noComment = this.stripComment(rawLine)
    const trimmed = noComment.trim()
    const header = this.matchHeader(trimmed)
    if (header) {
      this.handleTestHeader(header, results, tests, state)
    } else {
      this.collectTestOutput(state, noComment, trimmed)
    }
  }

  private handleTestHeader(
    header: { testId: string; passed: boolean },
    results: TestResult[],
    tests: AcceptanceTest[],
    state: { id: string | null; passed: boolean | null; output: string[] },
  ): void {
    this.flush(results, tests, state)
    state.id = header.testId
    state.passed = header.passed
    state.output = []
  }

  private collectTestOutput(state: { id: string | null; passed: boolean | null; output: string[] }, noComment: string, trimmed: string): void {
    if (state.id !== null && !this.isTapNoise(trimmed)) state.output.push(noComment)
  }

  private stripComment(line: string): string {
    const i = line.indexOf("#")
    return i >= 0 ? line.substring(0, i) : line
  }

  private isTapNoise(trimmed: string): boolean {
    return trimmed.startsWith("TAP version") || TapFlatAdapter.IS_PLAN_RE.test(trimmed) || trimmed.startsWith("#")
  }

  private matchHeader(trimmed: string): { testId: string; passed: boolean } | null {
    if (!trimmed) return null

    const m = TapFlatAdapter.LINE_RE.exec(trimmed)
    if (!m) return null

    const status = m[1]
    const testId = m[2]
    if (status === undefined || testId === undefined) return null

    return { testId, passed: status === "ok" }
  }

  private flush(results: TestResult[], tests: AcceptanceTest[], s: { id: string | null; passed: boolean | null; output: string[] }): void {
    if (!s.id || s.passed === null) return

    const test = tests.find(t => t.id === s.id)
    if (!test) return

    if (s.passed) {
      results.push({ id: s.id, test, passed: true })
      return
    }

    const outputText = s.output.join("\n")
    results.push({ id: s.id, test, passed: false, output: outputText.length > 0 ? outputText : undefined })
  }
}

const RUN_ATS_TOOL_ADAPTERS = {
  default: TapFlatAdapter,
  "tap-flat": TapFlatAdapter,
} as const

/**
 * Get an instance of the specified adapter
 * @param adapter - The adapter type to instantiate
 * @returns An instance of the specified adapter
 */
export function getInstance(adapter: keyof typeof RUN_ATS_TOOL_ADAPTERS): Adapter {
  return new RUN_ATS_TOOL_ADAPTERS[adapter]()
}
