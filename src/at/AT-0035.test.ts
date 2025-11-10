import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no issues, WHEN the user runs "s4 status", THEN the system displays the project is in good state', () => {
  expect(runSpec({}, "status --spec SPEC_FILE").stdout).toContain("No structural issues found")
})
