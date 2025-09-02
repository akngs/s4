import { createTempSpecFile } from "../test-utils.ts"
import validate from "./validate.ts"

it("validate command should succeed with valid spec", async () => {
  using specFile = createTempSpecFile()
  expect(await validate({ spec: specFile.path, format: "yaml" })).toMatchObject({ exitCode: 0 })
})

it("validate command should work with JSON format", async () => {
  using specFile = createTempSpecFile({}, "json")
  expect(await validate({ spec: specFile.path, format: "json" })).toMatchObject({ exitCode: 0 })
})

it("validate command should handle file not found error", async () => {
  expect(await validate({ spec: "nonexistent.yaml", format: "yaml" })).toBeError("io_error")
})

it("validate command should report validation issues", async () => {
  using specFile = createTempSpecFile({
    businessObjectives: [
      { id: "BO-0001", description: "One" },
      { id: "BO-0001", description: "Duplicate" },
    ],
  })
  expect(await validate({ spec: specFile.path, format: "yaml" })).toBeError("duplicate_id")
})
