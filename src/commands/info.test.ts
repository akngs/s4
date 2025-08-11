import { makeSpec, withTempSpecFile } from "../test-utils.ts"
import info from "./info.ts"

it("info command should succeed with valid feature ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "FE-0001", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.split("\n")).toContain("# FE-0001: Test Feature")
    expect(result.stderr).toBe("")
  })
})

it("info command should succeed with valid acceptance test ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "AT-0001", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.split("\n")).toContain("# AT-0001")
    expect(result.stderr).toBe("")
  })
})

it("info command should fail with invalid ID format", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "INVALID-123", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toBe("value_error: Invalid value: INVALID-123 - Invalid ID format. Expected FE-nnnn or AT-nnnn, got: INVALID-123")
  })
})

it("info command should fail with unknown feature ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "FE-9999", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toBe('value_error: Invalid value: FE-9999 - Feature "FE-9999" not found in spec')
  })
})

it("info command should fail with unknown acceptance test ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "AT-9999", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toBe('value_error: Invalid value: AT-9999 - Acceptance test "AT-9999" not found in spec')
  })
})
