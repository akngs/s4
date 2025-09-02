import { runSpec } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays a list of all features with their completion stats', () => {
  const result = runSpec({}, "status --spec SPEC_FILE")
  expect(result.stdout).toContain("✔ FE-0001: Test Feature (1/1)")
})
