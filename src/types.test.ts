import { assertNever, isLeft, isRight, isSyncIssue, isToolSetIssue, isValidationIssue, left, right } from "./types.ts"

describe("Either utilities", () => {
  it("creates left and right values correctly", () => {
    const l = left<string, number>("error")
    const r = right<string, number>(42)
    expect(l).toEqual({ _tag: "left", L: "error" })
    expect(r).toEqual({ _tag: "right", R: 42 })
  })

  it("type guards work as expected", () => {
    const l = left<string, number>("oops")
    const r = right<string, number>(10)
    expect(isLeft(l)).toBe(true)
    expect(isRight(l)).toBe(false)
    expect(isRight(r)).toBe(true)
    expect(isLeft(r)).toBe(false)
  })

  it("assertNever throws with the provided value", () => {
    const fn = () => assertNever("unexpected" as never)
    expect(fn).toThrowError(/Unexpected value: unexpected/)
  })
})

describe("Extra", () => {
  it("type guards should discriminate union types", () => {
    expect(isValidationIssue({ _tag: "uncovered_item", id: "BO-0001", itemType: "BO" })).toBe(true)
    expect(isSyncIssue({ _tag: "missing_at", id: "AT-0001", filePath: "p" })).toBe(true)
    expect(isToolSetIssue({ _tag: "failing_tests", testResults: [] })).toBe(true)
  })
})
