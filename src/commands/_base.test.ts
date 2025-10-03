import { left, right } from "fp-ts/lib/Either.js"
import { stringify as stringifyYaml } from "yaml"
import { ARCHETYPAL_SPEC, createTempSpecFile, makeSpec, unwrapLeft } from "../test-utils.ts"
import type { Left, SystemError, ValueError } from "../types.ts"
import { deserializeSpec, errToCommandReturn, loadSpec, parseSpec } from "./_base.ts"

const testData = { test: "value" }

it("should deserialize JSON successfully", () => {
  const result = deserializeSpec(JSON.stringify(testData), "json")
  expect(result).toEqual(right(testData))
})

it("should deserialize YAML successfully", () => {
  const result = deserializeSpec(stringifyYaml(testData), "yaml")
  expect(result).toEqual(right(testData))
})

it("should handle invalid JSON", () => {
  const result = unwrapLeft(deserializeSpec('{"invalid": json}', "json"))
  expect(result).toMatchObject({ _tag: "parse_error" })
})

it("should handle invalid YAML", () => {
  const result = unwrapLeft(deserializeSpec("invalid: yaml: content:", "yaml"))
  expect(result).toMatchObject({ _tag: "parse_error" })
})

it("should parse valid spec", () => {
  const result = parseSpec(makeSpec())
  expect(result).toEqual(right(makeSpec()))
})

it("should handle invalid spec", () => {
  const invalidSpec = { ...ARCHETYPAL_SPEC, title: undefined }
  const result = parseSpec(invalidSpec)
  expect(unwrapLeft(result)).toMatchObject({ _tag: "parse_error" })
})

it("should load and parse valid spec from file", async () => {
  const mockSpec = makeSpec()

  using tempFile = createTempSpecFile()
  const result = await loadSpec(tempFile.path, "yaml")
  expect(result).toEqual(right(mockSpec))
})

it("should handle file read errors", async () => {
  const result = await loadSpec("/nonexistent/file.yaml")
  expect(unwrapLeft(result)).toMatchObject({ _tag: "io_error" })
})

it("should convert value error to command return", () => {
  const valueError = left({ _tag: "value_error", message: "Test error", value: "test" }) as Left<SystemError | ValueError>
  expect(errToCommandReturn(valueError)).toEqual({
    stdout: "",
    stderr: "value_error: Invalid value: test - Test error",
    exitCode: 1,
  })
})

it("should convert system error to command return", () => {
  const systemError = left({ _tag: "parse_error", message: "Test error", cause: new Error("Test") }) as Left<SystemError | ValueError>
  expect(errToCommandReturn(systemError)).toEqual({
    stdout: "",
    stderr: "parse_error: Test error",
    exitCode: 1,
  })
})
