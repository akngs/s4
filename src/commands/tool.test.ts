import { ARCHETYPAL_SPEC, createTempSpecFile, makeSpec } from "../test-utils.ts"
import tool from "./tool.ts"

const SPEC_WITH_TOOLS = makeSpec({
  ...ARCHETYPAL_SPEC,
  tools: [
    { id: "echo-tool", command: "echo 'hello world'", stopOnError: false, recommendedNextActions: "Try running again if needed" },
    { id: "fail-tool", command: "bash -c 'echo failure; exit 1'", stopOnError: false, recommendedNextActions: "Check the error and retry" },
    { id: "fail-no-actions", command: "bash -c 'exit 1'", stopOnError: false, recommendedNextActions: "" },
  ],
})

it("should execute tool successfully with echo command", async () => {
  using tempFile = createTempSpecFile(SPEC_WITH_TOOLS)
  const result = await tool({ spec: tempFile.path, format: "yaml", toolId: "echo-tool" })
  expect(result).toMatchObject({ exitCode: 0, stdout: "hello world" })
})

it("should return error when tool is not found in spec", async () => {
  using tempFile = createTempSpecFile(SPEC_WITH_TOOLS)
  const result = await tool({ spec: tempFile.path, format: "yaml", toolId: "nonexistent-tool" })
  expect(result).toMatchObject({ exitCode: 1, stderr: 'value_error: Tool "nonexistent-tool" not found in spec' })
})

it("should return command output when tool command fails with no recommended actions", async () => {
  using tempFile = createTempSpecFile(SPEC_WITH_TOOLS)
  const result = await tool({ spec: tempFile.path, format: "yaml", toolId: "fail-no-actions" })
  expect(result).toMatchObject({ exitCode: 1, stdout: "", stderr: "" })
})

it("should append recommended actions when tool command fails", async () => {
  using tempFile = createTempSpecFile(SPEC_WITH_TOOLS)
  const result = await tool({ spec: tempFile.path, format: "yaml", toolId: "fail-tool" })
  expect(result).toMatchObject({ exitCode: 1, stdout: "failure\n\nCheck the error and retry" })
})

it("should include only recommended actions when command fails with empty stdout", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    tools: [{ id: "fail-actions-only", command: "bash -c 'exit 1'", stopOnError: false, recommendedNextActions: "Do this" }],
  })

  using tempFile = createTempSpecFile(spec)
  const result = await tool({ spec: tempFile.path, format: "yaml", toolId: "fail-actions-only" })
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toBe("Do this")
})

it("should pass-through output unchanged when command succeeds even if recommendedNextActions exist", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    tools: [{ id: "ok-with-actions", command: "echo content", stopOnError: false, recommendedNextActions: "some next" }],
  })

  using tempFile = createTempSpecFile(spec)
  const result = await tool({ spec: tempFile.path, format: "yaml", toolId: "ok-with-actions" })
  expect(result).toMatchObject({ exitCode: 0, stdout: "content" })
})
