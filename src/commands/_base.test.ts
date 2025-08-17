import { stringify as stringifyYaml } from "yaml"
import { ARCHETYPAL_SPEC } from "../test-utils.ts"
import { right, type S4, unwrapLeft } from "../types.ts"
import { deserializeSpec, parseSpec } from "./_base.ts"

const VALID_SPEC: S4 = ARCHETYPAL_SPEC

describe("deserialize()", () => {
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
})

describe("parse()", () => {
  it("should parse valid spec", () => {
    const result = parseSpec(VALID_SPEC)
    expect(result).toEqual(right(VALID_SPEC))
  })

  it("should handle invalid spec", () => {
    const invalidSpec = { ...VALID_SPEC, title: undefined }
    const result = parseSpec(invalidSpec)
    expect(unwrapLeft(result)).toMatchObject({ _tag: "parse_error" })
  })
})
