import { makeSpec } from "../test-utils.ts"
import tool from "./tool.ts"

it("should execute tool successfully with echo command", async () => {
  const spec = makeSpec({
    tools: [{ id: "test-tool", command: 'echo "Hello World"', recommendedNextActions: "" }],
  })
  const result = await tool(spec, "test-tool")
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe("Hello World")
})

it("should return error when tool is not found in spec", async () => {
  const spec = makeSpec()
  const result = await tool(spec, "nonexistent-tool")
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("value_error")
})

it("should return command output when tool command fails with no recommended actions", async () => {
  const spec = makeSpec({
    tools: [{ id: "failing-tool", command: "bash -c 'exit 1'", recommendedNextActions: "" }],
  })
  const result = await tool(spec, "failing-tool")
  expect(result.exitCode).toBe(1)
})

it("should append recommended actions when tool command fails", async () => {
  const spec = makeSpec({
    tools: [{ id: "failing-tool", command: "bash -c 'exit 1'", recommendedNextActions: "Fix the issue" }],
  })
  const result = await tool(spec, "failing-tool")
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContain("Fix the issue")
})

it("should include only recommended actions when command fails with empty stdout", async () => {
  const spec = makeSpec({
    tools: [{ id: "failing-tool", command: "bash -c 'exit 1'", recommendedNextActions: "Fix the issue" }],
  })
  const result = await tool(spec, "failing-tool")
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContain("Fix the issue")
})

it("should pass-through output unchanged when command succeeds even if recommendedNextActions exist", async () => {
  const spec = makeSpec({
    tools: [{ id: "success-tool", command: 'echo "Success"', recommendedNextActions: "Next step" }],
  })
  const result = await tool(spec, "success-tool")
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe("Success")
})
