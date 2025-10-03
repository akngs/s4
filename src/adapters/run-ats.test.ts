import dedent from "dedent"
import { unwrapRight } from "../test-utils.ts"
import type { AcceptanceTest } from "../types.ts"
import { getInstance } from "./run-ats.ts"

const tests: AcceptanceTest[] = [
  { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
  { id: "AT-0002", covers: "FE-0001", given: "G", when: "W", then: "T" },
  { id: "AT-0003", covers: "FE-0001", given: "G", when: "W", then: "T" },
]

it("should parse valid TAP-flat output", () => {
  const raw = dedent`
    ok 1 - src/at/AT-0001.test.ts > GIVEN a spec file, WHEN I validate it, THEN it should pass
    not ok 2 - src/at/AT-0002.test.ts > GIVEN invalid input, WHEN I validate it, THEN it should fail
    ok 3 - src/at/AT-0003.test.ts > GIVEN another test, WHEN I run it, THEN it should pass
  `

  const result = getInstance("default").parse(tests, { stdout: raw, stderr: "", exitCode: 1 })
  expect(unwrapRight(result).map(r => ({ id: r.id, passed: r.passed }))).toEqual([
    { id: "AT-0001", passed: true },
    { id: "AT-0002", passed: false },
    { id: "AT-0003", passed: true },
  ])
})

it("should handle empty output", () => {
  expect(unwrapRight(getInstance("default").parse([], { stdout: "", stderr: "", exitCode: 0 }))).toEqual([])
})

it("should capture output for failed tests", () => {
  const raw = dedent`
    ok 1 - src/at/AT-0001.test.ts > GIVEN a spec file, WHEN I validate it, THEN it should pass
    not ok 2 - src/at/AT-0002.test.ts > GIVEN invalid input, WHEN I validate it, THEN it should fail
    Error: Validation failed
      Error message (with intentional two new lines)

      Another message
    ok 3 - src/at/AT-0003.test.ts > GIVEN another test, WHEN I run it, THEN it should pass
  `

  expect(
    unwrapRight(getInstance("default").parse(tests, { stdout: raw, stderr: "", exitCode: 1 })).map(r => ({ id: r.id, passed: r.passed })),
  ).toEqual([
    { id: "AT-0001", passed: true },
    { id: "AT-0002", passed: false },
    { id: "AT-0003", passed: true },
  ])
  expect(unwrapRight(getInstance("default").parse(tests, { stdout: raw, stderr: "", exitCode: 1 }))[1]).toMatchObject({
    output: "Error: Validation failed\n  Error message (with intentional two new lines)\n\n  Another message",
  })
})
