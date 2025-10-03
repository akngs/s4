// Tests for performOverallStatusCheck focusing on branch coverage

import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeSpec, unwrapRight } from "../test-utils.ts"
import * as execMod from "./exec.ts"
import { performOverallStatusCheck } from "./status.ts"

/**
 * Build a TAP-flat header line.
 * @param ok Whether the test passed.
 * @param id Acceptance test ID, e.g., "AT-0001".
 * @param text GIVEN/WHEN/THEN description text.
 * @returns A single TAP-flat header line.
 */
function tapLine(ok: boolean, id: string, text: string): string {
  const status = ok ? "ok" : "not ok"
  return `${status} 1 - src/at/${id}.test.ts > ${text}`
}

describe("performOverallStatusCheck()", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("includes failing_tests and failing_tools when they occur", async () => {
    // Ensure we have a tool so failing_tools can be generated
    const spec = makeSpec({
      tools: [{ id: "lint", command: "lint-cmd", stopOnError: true, recommendedNextActions: "fix" }],
    })

    const execSpy = vi.spyOn(execMod, "executeCommand")

    // 1) runAcceptanceTests → produce a failing test
    execSpy.mockResolvedValueOnce({
      stdout: `${tapLine(false, spec.acceptanceTests[0]?.id ?? "AT-0001", "GIVEN G, WHEN W, THEN T")}\n1..1`,
      stderr: "",
      exitCode: 0,
    })

    // 2) listAcceptanceTests → matches spec, so no sync issues
    execSpy.mockResolvedValueOnce({ stdout: `${spec.acceptanceTests[0]?.id ?? "AT-0001"}: GIVEN G, WHEN W, THEN T`, stderr: "", exitCode: 0 })

    // 3) tool execution → fail
    execSpy.mockResolvedValueOnce({ stdout: "", stderr: "e", exitCode: 1 })

    const tags = new Set(unwrapRight(await performOverallStatusCheck(spec)).issues.map(i => i._tag))
    expect(tags.has("failing_tests")).toBe(true)
    expect(tags.has("failing_tools")).toBe(true)
  })

  it("returns left when sync detection fails", async () => {
    const spec = makeSpec()

    const execSpy = vi.spyOn(execMod, "executeCommand")

    // 1) runAcceptanceTests → passing
    execSpy.mockResolvedValueOnce({
      stdout: `${tapLine(true, spec.acceptanceTests[0]?.id ?? "AT-0001", "GIVEN G, WHEN W, THEN T")}\n1..1`,
      stderr: "",
      exitCode: 0,
    })

    // 2) listAcceptanceTests → simulate command failure
    execSpy.mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })

    const result = await performOverallStatusCheck(spec)
    expect(result._tag).toBe("Left")
  })
})
