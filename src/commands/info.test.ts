import { makeSpec } from "../test-utils.ts"
import info from "./info.ts"

it("info command should succeed with valid feature ID", () => {
  const result = info(makeSpec(), "FE-0001")
  expect(result.exitCode).toBe(0)
  expect(result.stdout.split("\n")).toContain("# FE-0001: Test Feature")
})

it("info command should succeed with valid acceptance test ID", () => {
  const result = info(makeSpec(), "AT-0001")
  expect(result.exitCode).toBe(0)
  expect(result.stdout.split("\n")).toContain("# AT-0001")
})

it("info command should fail with invalid ID format", () => {
  const result = info(makeSpec(), "INVALID-123")
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("value_error")
})

it("info command should fail with unknown feature ID", () => {
  const result = info(makeSpec(), "FE-9999")
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("value_error")
})

it("info command should fail with unknown acceptance test ID", () => {
  const result = info(makeSpec(), "AT-9999")
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("value_error")
})
