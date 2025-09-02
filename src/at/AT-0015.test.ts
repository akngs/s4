import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 run-ats", THEN the system executes all acceptance tests and returns the results', () => {
  const result = runSpec({}, "run-ats --spec SPEC_FILE")
  expect(result.status).toBe(0)
  expect(result.stdout).toContain("All acceptance tests are passing")
})
