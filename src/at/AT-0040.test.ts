import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with an acceptance test "AT-0001", WHEN the user runs "s4 info AT-0001", THEN the system displays detailed information about the acceptance test in markdown format', () => {
  runSpec({}, "info AT-0001 --spec SPEC_FILE", result => {
    expect(result.stdout).toContainInOrder([
      "# AT-0001",
      "GIVEN G, WHEN W, THEN T",
      "## Feature Covered by This Acceptance Test",
      "FE-0001: Test Feature",
      "## Related Business Objectives",
      "BO-0001: Test business objective",
    ])
  })
})
