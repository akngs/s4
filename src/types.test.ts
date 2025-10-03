import { assertNever, isSyncIssue, isToolSetIssue, isValidationIssue } from "./types.ts"

it("assertNever throws with the provided value", () => {
  const fn = () => assertNever("unexpected" as never)
  expect(fn).toThrowError(/Unexpected value: unexpected/)
})

it("type guards should discriminate union types", () => {
  expect(isValidationIssue({ _tag: "uncovered_item", id: "BO-0001", itemType: "BO" })).toBe(true)
  expect(isSyncIssue({ _tag: "missing_at", id: "AT-0001", filePath: "p" })).toBe(true)
  expect(isToolSetIssue({ _tag: "failing_tests", testResults: [] })).toBe(true)
})
