import dedent from "dedent"
import { unwrapLeft, unwrapRight } from "../test-utils.ts"
import { getInstance } from "./list-ats.ts"

describe("DefaultAdapter.parse()", () => {
  it("should parse valid acceptance test list output", () => {
    const raw = dedent`
      AT-0001: GIVEN A, WHEN B, THEN C
      AT-0002: GIVEN D, WHEN E, THEN F
    `
    expect(unwrapRight(getInstance("default").parse(raw))).toEqual([
      { id: "AT-0001", description: "GIVEN A, WHEN B, THEN C" },
      { id: "AT-0002", description: "GIVEN D, WHEN E, THEN F" },
    ])
  })

  it("should handle empty output", () => {
    expect(unwrapRight(getInstance("default").parse(""))).toEqual([])
  })

  it("should return Left when malformed lines are found", () => {
    const raw = dedent`
      AT-0001: Valid test
      Invalid line without colon
      AT-0002: Another valid test
    `
    expect(unwrapLeft(getInstance("default").parse(raw))).toEqual({
      _tag: "adapter_error",
      adapter: "at-listing-tool",
      cause: "Malformed lines found at line numbers: 2",
    })
  })
})
