import { makeSpec, withTempSpecFile } from "../test-utils.ts"
import info from "./info.ts"

it("info command should succeed with valid feature ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "FE-0001", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.split("\n")).toContain("# FE-0001: Test Feature")
  })
})

it("info command should succeed with valid acceptance test ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await info({ id: "AT-0001", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.split("\n")).toContain("# AT-0001")
  })
})

it("info command should fail with invalid ID format", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    expect(await info({ id: "INVALID-123", spec: tempFile, format: "yaml" })).toBeError("value_error")
  })
})

it("info command should fail with unknown feature ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    expect(await info({ id: "FE-9999", spec: tempFile, format: "yaml" })).toBeError("value_error")
  })
})

it("info command should fail with unknown acceptance test ID", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    expect(await info({ id: "AT-9999", spec: tempFile, format: "yaml" })).toBeError("value_error")
  })
})
