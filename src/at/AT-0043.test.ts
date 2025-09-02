import { runSpec } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays the project title, mission, and vision', () => {
  expect(runSpec({}, "status --spec SPEC_FILE").stdout).toContainInOrder(["# Test Specification", "- Mission: Test mission", "- Vision: Test vision"])
})
