import { makeSpec } from "../test-utils.ts"
import tools from "./tools.ts"

it("should run all tools and render tools section when all succeed", async () => {
  const spec = makeSpec({
    tools: [
      { id: "tool1", command: 'echo "Success 1"', recommendedNextActions: "" },
      { id: "tool2", command: 'echo "Success 2"', recommendedNextActions: "" },
    ],
  })
  const result = await tools(spec)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("tool1: success")
  expect(result.stdout).toContain("tool2: success")
})

it("should stop on error when a tool fails with stopOnError=true and render failures", async () => {
  const spec = makeSpec({
    tools: [
      { id: "tool1", command: 'echo "Success"', recommendedNextActions: "" },
      { id: "tool2", command: "bash -c 'exit 1'", recommendedNextActions: "" },
    ],
  })
  const result = await tools(spec)
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContain("tool1: success")
  expect(result.stdout).toContain("tool2: failure")
})

it("should continue after failure when stopOnError=false and reflect last exit code; render status", async () => {
  const spec = makeSpec({
    tools: [
      { id: "tool1", command: 'echo "Success"', recommendedNextActions: "" },
      { id: "tool2", command: "bash -c 'exit 1'", recommendedNextActions: "" },
      { id: "tool3", command: 'echo "Success 3"', recommendedNextActions: "" },
    ],
  })
  const result = await tools(spec)
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContain("tool1: success")
  expect(result.stdout).toContain("tool2: failure")
  expect(result.stdout).toContain("tool3: success")
})

it("should handle empty tools array and still render tools header", async () => {
  const spec = makeSpec({
    tools: [],
  })
  const result = await tools(spec)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe("")
})

it("should return io_error when spec file is not found", async () => {
  const spec = makeSpec({
    tools: [{ id: "tool1", command: 'echo "Success"', recommendedNextActions: "" }],
  })
  const result = await tools(spec)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("tool1: success")
})
