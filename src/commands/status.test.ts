import { makeSpec, withTempSpecFile, withTempTextFile } from "../test-utils.ts"
import status from "./status.ts"

it("status command should succeed with valid spec", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await status({ spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("# Test Specification")
  })
})

it("status command should work with JSON format", async () => {
  await withTempSpecFile(
    makeSpec(),
    async tempFile => {
      const result = await status({ spec: tempFile, format: "json" })
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain("# Test Specification")
    },
    "json",
  )
})

it("status command should handle file not found error", async () => {
  const result = await status({ spec: "nonexistent.yaml", format: "yaml" })
  expect(result).toBeError("io_error")
})

it("status command should handle invalid file formats", async () => {
  await withTempTextFile("invalid: yaml: content: [", async tempFile => {
    const result = await status({ spec: tempFile, format: "yaml" })
    expect(result).toBeError("parse_error")
  })
})

it("status command should handle invalid spec schema", async () => {
  await withTempTextFile("title: Invalid Spec\n", async tempFile => {
    const result = await status({ spec: tempFile, format: "yaml" })
    expect(result).toBeError("parse_error")
  })
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

  await withTempSpecFile(invalidSpec, async tempFile => {
    const result = await status({ spec: tempFile, format: "yaml" })
    expect(result).toBeError("adapter_error")
  })
})
