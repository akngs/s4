import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 run-ats", THEN the system executes all acceptance tests and returns the results', () => {
  runSpec({}, "run-ats --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("All acceptance tests are passing")
  })
})
