import { runSpec } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays all business objectives', () => {
  expect(runSpec({}, "status --spec SPEC_FILE").stdout).toContain("- BO-0001: Test business objective")
})
