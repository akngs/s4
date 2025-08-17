import { ARCHETYPAL_SPEC, makeSpec as makeArchetypalSpec } from "../test-utils.ts"
import type { S4 } from "../types.ts"
import { runAllToolsDetailed } from "./tools.ts"

const makeSpec = (overrides: Partial<S4>): S4 => makeArchetypalSpec({ ...ARCHETYPAL_SPEC, ...overrides })

describe("runAllToolsDetailed()", () => {
  const SPEC_WITH_TOOLS: S4 = makeSpec({
    tools: [
      { id: "success-tool", command: "echo 'success'", stopOnError: false, recommendedNextActions: "Continue with next step" },
      { id: "another-success", command: "echo 'another'", stopOnError: false, recommendedNextActions: "All good" },
    ],
  })

  const SPEC_WITH_FAILING_TOOL: S4 = makeSpec({
    ...SPEC_WITH_TOOLS,
    tools: [
      { id: "success-tool", command: "echo 'success'", stopOnError: false, recommendedNextActions: "Continue" },
      { id: "fail-tool", command: "bash -c 'echo error >&2; exit 1'", stopOnError: true, recommendedNextActions: "Fix the error" },
      { id: "never-runs", command: "echo 'never executed'", stopOnError: false, recommendedNextActions: "Should not see this" },
    ],
  })

  const SPEC_WITH_FAILING_NO_STOP: S4 = makeSpec({
    ...SPEC_WITH_TOOLS,
    tools: [
      { id: "fail-tool", command: "bash -c 'exit 1'", stopOnError: false, recommendedNextActions: "Keep going" },
      { id: "success-after-fail", command: "echo 'still runs'", stopOnError: false, recommendedNextActions: "Final step" },
    ],
  })

  it("should run all tools successfully when all commands succeed", async () => {
    const [tool1, tool2] = await runAllToolsDetailed(SPEC_WITH_TOOLS)
    expect(tool1).toMatchObject({ id: "success-tool", stdout: "success", stderr: "", exitCode: 0, recommendedNextActions: "Continue with next step" })
    expect(tool2).toMatchObject({ id: "another-success", stdout: "another", exitCode: 0 })
  })

  it("should stop execution when tool fails and stopOnError is true", async () => {
    const result = await runAllToolsDetailed(SPEC_WITH_FAILING_TOOL)
    expect(result[0]).toMatchObject({ id: "success-tool", exitCode: 0 })
    expect(result[1]).toMatchObject({ id: "fail-tool", exitCode: 1, stderr: "error\n" })
    expect(result.find(t => t.id === "never-runs")).toBeUndefined()
  })

  it("should continue execution when tool fails but stopOnError is false", async () => {
    const [failTool, successTool] = await runAllToolsDetailed(SPEC_WITH_FAILING_NO_STOP)
    expect(failTool).toMatchObject({ id: "fail-tool", exitCode: 1 })
    expect(successTool).toMatchObject({ id: "success-after-fail", exitCode: 0, stdout: "still runs" })
  })

  it("should handle empty tools array", async () => {
    expect(await runAllToolsDetailed(makeSpec({ ...SPEC_WITH_TOOLS, tools: [] }))).toHaveLength(0)
  })
})
