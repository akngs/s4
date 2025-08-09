import dedent from "dedent"
import { isLeft, isRight } from "../types.ts"
import { getInstance } from "./list-ats.ts"

describe("DefaultAdapter.parse()", () => {
  it("should parse valid acceptance test list output", () => {
    const raw = dedent`
      AT-0001: GIVEN A, WHEN B, THEN C
      AT-0002: GIVEN D, WHEN E, THEN F
    `

    const adapter = getInstance("default")
    const result = adapter.parse(raw)

    expect(isRight(result)).toBe(true)
    if (isRight(result)) {
      expect(result.R).toEqual([
        { id: "AT-0001", description: "GIVEN A, WHEN B, THEN C" },
        { id: "AT-0002", description: "GIVEN D, WHEN E, THEN F" },
      ])
    }
  })

  it("should handle empty output", () => {
    const raw = ""

    const adapter = getInstance("default")
    const result = adapter.parse(raw)

    expect(isRight(result)).toBe(true)
    if (isRight(result)) {
      expect(result.R).toEqual([])
    }
  })

  it("should return Left when malformed lines are found", () => {
    const raw = dedent`
      AT-0001: Valid test
      Invalid line without colon
      AT-0002: Another valid test
    `

    const adapter = getInstance("default")
    const result = adapter.parse(raw)

    expect(isLeft(result)).toBe(true)
    if (isLeft(result)) {
      expect(result.L).toEqual({
        _tag: "adapter_error",
        adapter: "at-listing-tool",
        cause: "Malformed lines found at line numbers: 2",
      })
    }
  })

  it("should handle whitespace in descriptions", () => {
    const raw = dedent`
      AT-0001:   Given a spec file   When I validate it   Then it should pass  
    `

    const adapter = getInstance("default")
    const result = adapter.parse(raw)

    expect(isRight(result)).toBe(true)
    if (isRight(result)) {
      expect(result.R).toEqual([{ id: "AT-0001", description: "Given a spec file   When I validate it   Then it should pass" }])
    }
  })
})
