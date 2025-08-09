import { stringify as stringifyYaml } from "yaml"
import { ARCHETYPAL_SPEC } from "../test-utils.ts"
import { right, type S4 } from "../types.ts"
import { deserializeSpec, parseSpec } from "./_base.ts"

const VALID_SPEC: S4 = ARCHETYPAL_SPEC

describe("deserialize()", () => {
  const testData = { test: "value", number: 42 }

  it("should deserialize JSON successfully", () => {
    const jsonString = JSON.stringify(testData)
    const result = deserializeSpec(jsonString, "json")
    expect(result).toEqual(right(testData))
  })

  it("should deserialize YAML successfully", () => {
    const yamlString = stringifyYaml(testData)
    const result = deserializeSpec(yamlString, "yaml")
    expect(result).toEqual(right(testData))
  })

  it("should handle invalid JSON", () => {
    const result = deserializeSpec('{"invalid": json}', "json")
    expect(result._tag).toBe("left")
    if (result._tag === "left" && result.L._tag === "parse_error") {
      expect(result.L.message).toContain("SyntaxError")
    }
  })

  it("should handle invalid YAML", () => {
    const result = deserializeSpec("invalid: yaml: content:", "yaml")
    expect(result._tag).toBe("left")
    if (result._tag === "left" && result.L._tag === "parse_error") {
      expect(result.L.message).toContain("YAMLParseError")
    }
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
    expect(result._tag).toBe("left")
    if (result._tag === "left" && result.L._tag === "parse_error") {
      expect(result.L.message).toContain("invalid_type")
    }
  })
})
