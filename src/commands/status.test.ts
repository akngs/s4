import { createTempSpecFile, createTempTextFile, makeSpec } from "../test-utils.ts"
import status from "./status.ts"

it("status command should succeed with valid spec", async () => {
  using tempFile = createTempSpecFile(makeSpec())
  const result = await status({ spec: tempFile.path, format: "yaml" })
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("# Test Specification")
})

it("status command should work with JSON format", async () => {
  using tempFile = createTempSpecFile(makeSpec(), "json")
  const result = await status({ spec: tempFile.path, format: "json" })
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("# Test Specification")
})

it("status command should handle file not found error", async () => {
  expect(await status({ spec: "nonexistent.yaml", format: "yaml" })).toBeError("io_error")
})

it("status command should handle invalid file formats", async () => {
  using tempFile = createTempTextFile("invalid: yaml: content: [")
  expect(await status({ spec: tempFile.path, format: "yaml" })).toBeError("parse_error")
})

it("status command should handle invalid spec schema", async () => {
  using tempFile = createTempTextFile("title: Invalid Spec\n")
  expect(await status({ spec: tempFile.path, format: "yaml" })).toBeError("parse_error")
})

it("status command should handle spec with validation issues", async () => {
  const invalidSpec = makeSpec({
    // produce adapter_error by breaking listAcceptanceTests output format (malformed lines)
    connectors: {
      listAcceptanceTests: 'echo "AT-0001"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Done"',
      runAcceptanceTests: 'echo "Done"',
    },
  })

  using tempFile = createTempSpecFile(invalidSpec)
  expect(await status({ spec: tempFile.path, format: "yaml" })).toBeError("adapter_error")
})
