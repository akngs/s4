import { makeSpec } from "../test-utils.ts"
import tools from "./tools.ts"

it("should run all tools and render tools section when all succeed", async () => {
  const result = await tools(
    makeSpec({
      tools: [
        { id: "tool1", command: 'echo "Success 1"', recommendedNextActions: "" },
        { id: "tool2", command: 'echo "Success 2"', recommendedNextActions: "" },
      ],
    }),
  )
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContainInOrder(["✔ success tool1", "✔ success tool2"])
})

it("should stop on error when a tool fails with stopOnError=true and render failures", async () => {
  const result = await tools(
    makeSpec({
      tools: [
        { id: "tool1", command: 'echo "Success"', recommendedNextActions: "" },
        { id: "tool2", command: "bash -c 'exit 1'", recommendedNextActions: "" },
      ],
    }),
  )
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContainInOrder(["✔ success tool1", "✘ failure tool2"])
})

it("should continue after failure when stopOnError=false and reflect last exit code; render status", async () => {
  const result = await tools(
    makeSpec({
      tools: [
        { id: "tool1", command: 'echo "Success"', recommendedNextActions: "" },
        { id: "tool2", command: "bash -c 'exit 1'", recommendedNextActions: "", stopOnError: false },
        { id: "tool3", command: 'echo "Success 3"', recommendedNextActions: "" },
      ],
    }),
  )
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContainInOrder(["✔ success tool1", "✘ failure tool2", "✔ success tool3"])
})

it("should return io_error when spec file is not found", async () => {
  const result = await tools(
    makeSpec({
      tools: [{ id: "tool1", command: 'echo "Success"', recommendedNextActions: "" }],
    }),
  )
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("✔ success tool1")
})
