import { assertNever, isLeft, isRight, isSyncIssue, isToolSetIssue, isValidationIssue, left, map, mapLeft, right } from "./types.ts"

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

  it("map transforms right values and leaves left unchanged", () => {
    const r = right<string, number>(2)
    const mapped = map(r, n => n * 2)
    expect(mapped).toEqual({ _tag: "right", R: 4 })
    const l = left<string, number>("err")
    const unchanged = map(l, n => n * 2)
    expect(unchanged).toBe(l)
  })

  it("mapLeft transforms left values and leaves right unchanged", () => {
    const l = left<string, number>("oops")
    const mapped = mapLeft(l, msg => `${msg}!`)
    expect(mapped).toEqual({ _tag: "left", L: "oops!" })
    const r = right<string, number>(1)
    const unchanged = mapLeft(r, msg => `${msg}!`)
    expect(unchanged).toBe(r)
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

  it("map/mapLeft should not alter Left/Right opposite sides", () => {
    const r = right<string, number>(1)
    const r2 = map(r, x => x + 1)
    expect("R" in r2 && r2.R).toBe(2)
    const l = left<string, number>("x")
    const l2 = mapLeft(l, s => `${s}-e`)
    expect("L" in l2 && l2.L).toBe("x-e")
  })
})
