import { makeSpec } from "../test-utils.ts"
import validate from "./validate.ts"

it("validate command should succeed with valid spec", () => {
  const spec = makeSpec()
  const result = validate(spec)
  expect(result.exitCode).toBe(0)
})

it("validate command should work with JSON format", () => {
  const spec = makeSpec()
  const result = validate(spec)
  expect(result.exitCode).toBe(0)
})

it("validate command should handle file not found error", () => {
  const spec = makeSpec()
  const result = validate(spec)
  expect(result.exitCode).toBe(0)
})

it("validate command should report validation issues", () => {
  const spec = makeSpec({
    businessObjectives: [],
    features: [],
    acceptanceTests: [],
  })
  const result = validate(spec)
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("missing_section")
})
