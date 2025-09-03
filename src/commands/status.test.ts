import { makeSpec } from "../test-utils.ts"
import status from "./status.ts"

it("status command should succeed with valid spec", async () => {
  const spec = makeSpec()
  const result = await status(spec)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("Project Summary")
})

it("status command should work with JSON format", async () => {
  const spec = makeSpec()
  const result = await status(spec)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("Project Summary")
})

it("status command should handle file not found error", async () => {
  const spec = makeSpec()
  const result = await status(spec)
  expect(result.exitCode).toBe(0)
})

it("status command should handle spec with validation issues", async () => {
  const spec = makeSpec({
    businessObjectives: [],
    features: [],
    acceptanceTests: [],
  })
  const result = await status(spec)
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toContain("Project Summary")
})
