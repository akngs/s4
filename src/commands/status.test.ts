import { createTempSpecFile } from "../test-utils.ts"
import status from "./status.ts"

it("status command should succeed with valid spec", async () => {
  using specFile = createTempSpecFile()
  const result = await status({ spec: specFile.path, format: "yaml" })
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("# Test Specification")
})

it("status command should work with JSON format", async () => {
  using specFile = createTempSpecFile({}, "json")
  const result = await status({ spec: specFile.path, format: "json" })
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("# Test Specification")
})

it("status command should handle file not found error", async () => {
  expect(await status({ spec: "nonexistent.yaml", format: "yaml" })).toBeError("io_error")
})

it("status command should handle spec with validation issues", async () => {
  using specFile = createTempSpecFile({
    // produce adapter_error by breaking listAcceptanceTests output format (malformed lines)
    connectors: {
      listAcceptanceTests: 'echo "AT-0001"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Done"',
      runAcceptanceTests: 'echo "Done"',
    },
  })

  expect(await status({ spec: specFile.path, format: "yaml" })).toBeError("adapter_error")
})
