import { makeSpec, withTempSpecFile, withTempTextFile } from "../test-utils.ts"
import validate from "./validate.ts"

it("validate command should succeed with valid spec", async () => {
  await withTempSpecFile(makeSpec(), async tempFile => {
    expect(await validate({ spec: tempFile, format: "yaml" })).toMatchObject({ exitCode: 0 })
  })
})

it("validate command should work with JSON format", async () => {
  await withTempSpecFile(
    makeSpec(),
    async tempFile => {
      expect(await validate({ spec: tempFile, format: "json" })).toMatchObject({ exitCode: 0 })
    },
    "json",
  )
})

it("validate command should handle file not found error", async () => {
  expect(await validate({ spec: "nonexistent.yaml", format: "yaml" })).toBeError("io_error")
})

it("validate command should handle invalid file formats", async () => {
  await withTempTextFile("invalid: yaml: content: [", async tempFile => {
    expect(await validate({ spec: tempFile, format: "yaml" })).toBeError("parse_error")
  })
})

it("validate command should handle invalid spec schema", async () => {
  await withTempTextFile("title: Invalid Spec\n", async tempFile => {
    expect(await validate({ spec: tempFile, format: "yaml" })).toBeError("parse_error")
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
    expect(await validate({ spec: tempFile, format: "yaml" })).toBeError("duplicate_id")
  })
})
