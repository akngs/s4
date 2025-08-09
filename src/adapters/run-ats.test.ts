import dedent from "dedent"
import { type AcceptanceTest, type AdapterError, type Either, isRight, type TestResult } from "../types.ts"
import { getInstance } from "./run-ats.ts"

describe("TapFlatAdapter.parse()", () => {
  const tests: AcceptanceTest[] = [
    { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
    { id: "AT-0002", covers: "FE-0001", given: "G", when: "W", then: "T" },
    { id: "AT-0003", covers: "FE-0001", given: "G", when: "W", then: "T" },
  ]

  /**
   * Assert IDs and pass flags of parsed results
   * @param result - Adapter parse result Either
   * @param expected - Expected id/pass pairs in order
   */
  function assertIdsAndPassStatus(result: Either<AdapterError, TestResult[]>, expected: Array<{ id: string; passed: boolean }>): void {
    expect(isRight(result)).toBe(true)
    if (isRight(result)) {
      expect(result.R.map((r: TestResult) => ({ id: r.id, passed: r.passed }))).toEqual(expected)
    }
  }

  it("should parse valid TAP-flat output", () => {
    const raw = dedent`
      ok 1 - src/at/AT-0001.test.ts > GIVEN a spec file, WHEN I validate it, THEN it should pass
      not ok 2 - src/at/AT-0002.test.ts > GIVEN invalid input, WHEN I validate it, THEN it should fail
      ok 3 - src/at/AT-0003.test.ts > GIVEN another test, WHEN I run it, THEN it should pass
    `

    const adapter = getInstance("default")
    const result = adapter.parse(tests, { stdout: raw, stderr: "", exitCode: 1 })
    assertIdsAndPassStatus(result, [
      { id: "AT-0001", passed: true },
      { id: "AT-0002", passed: false },
      { id: "AT-0003", passed: true },
    ])
  })

  it("should handle empty output", () => {
    const tests: AcceptanceTest[] = []
    const raw = ""

    const adapter = getInstance("default")
    const result = adapter.parse(tests, { stdout: raw, stderr: "", exitCode: 0 })

    expect(isRight(result)).toBe(true)
    if (isRight(result)) {
      expect(result.R).toEqual([])
    }
  })

  it("should capture output for failed tests", () => {
    const raw = dedent`
      ok 1 - src/at/AT-0001.test.ts > GIVEN a spec file, WHEN I validate it, THEN it should pass
      not ok 2 - src/at/AT-0002.test.ts > GIVEN invalid input, WHEN I validate it, THEN it should fail
      Error: Validation failed
        Error message (with intentional two new lines)

        Another message
      ok 3 - src/at/AT-0003.test.ts > GIVEN another test, WHEN I run it, THEN it should pass
    `

    const adapter = getInstance("default")
    const result = adapter.parse(tests, { stdout: raw, stderr: "", exitCode: 1 })
    assertIdsAndPassStatus(result, [
      { id: "AT-0001", passed: true },
      { id: "AT-0002", passed: false },
      { id: "AT-0003", passed: true },
    ])
    if (isRight(result)) {
      const second = result.R[1] as Extract<TestResult, { passed: false }>
      expect(second.output).toBe("Error: Validation failed\n  Error message (with intentional two new lines)\n\n  Another message")
    }
  })
})
