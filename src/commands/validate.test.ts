import dedent from "dedent"
import { makeSpec, withTempSpecFile, withTempTextFile } from "../test-utils.ts"
import validate from "./validate.ts"

it("validate command should succeed with valid spec", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    const result = await validate({ spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
  })
})

it("validate command should work with JSON format", async () => {
  await withTempSpecFile(
    makeSpec(),
    async tempFile => {
      const result = await validate({ spec: tempFile, format: "json" })
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
    },
    "json",
  )
})

it("validate command should handle file not found error", async () => {
  const result = await validate({ spec: "nonexistent.yaml", format: "yaml" })
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("io_error")
})

it("validate command should handle invalid file formats", async () => {
  await withTempTextFile("invalid: yaml: content: [", async tempFile => {
    const result = await validate({ spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("parse_error")
  })
})

it("validate command should handle invalid spec schema", async () => {
  await withTempTextFile(dedent`title: Invalid Spec`, async tempFile => {
    const result = await validate({ spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("parse_error")
  })
})

it("validate command should report validation issues", async () => {
  const specWithDuplicateIds = makeSpec({
    businessObjectives: [
      { id: "BO-0001", description: "One" },
      { id: "BO-0001", description: "Duplicate" },
    ],
  })

  await withTempSpecFile(specWithDuplicateIds, async tempFile => {
    const result = await validate({ spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("duplicate_id")
  })
})
