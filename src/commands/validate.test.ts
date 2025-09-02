import { createTempSpecFile, createTempTextFile, makeSpec } from "../test-utils.ts"
import validate from "./validate.ts"

it("validate command should succeed with valid spec", async () => {
  using tempFile = createTempSpecFile(makeSpec())
  expect(await validate({ spec: tempFile.path, format: "yaml" })).toMatchObject({ exitCode: 0 })
})

it("validate command should work with JSON format", async () => {
  using tempFile = createTempSpecFile(makeSpec(), "json")
  expect(await validate({ spec: tempFile.path, format: "json" })).toMatchObject({ exitCode: 0 })
})

it("validate command should handle file not found error", async () => {
  expect(await validate({ spec: "nonexistent.yaml", format: "yaml" })).toBeError("io_error")
})

it("validate command should handle invalid file formats", async () => {
  using tempFile = createTempTextFile("invalid: yaml: content: [")
  expect(await validate({ spec: tempFile.path, format: "yaml" })).toBeError("parse_error")
})

it("validate command should handle invalid spec schema", async () => {
  using tempFile = createTempTextFile("title: Invalid Spec\n")
  expect(await validate({ spec: tempFile.path, format: "yaml" })).toBeError("parse_error")
})

it("validate command should report validation issues", async () => {
  const specWithDuplicateIds = makeSpec({
    businessObjectives: [
      { id: "BO-0001", description: "One" },
      { id: "BO-0001", description: "Duplicate" },
    ],
  })

  using tempFile = createTempSpecFile(specWithDuplicateIds)
  expect(await validate({ spec: tempFile.path, format: "yaml" })).toBeError("duplicate_id")
})
