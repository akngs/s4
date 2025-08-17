import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a feature "FE-0001", WHEN the user runs "s4 info FE-0001", THEN the system displays detailed information about the feature in markdown format', () => {
  runSpec({}, "info FE-0001 --spec SPEC_FILE", result => {
    expect(result.stdout).toContainInOrder([
      "# FE-0001: Test Feature",
      "Test feature description",
      "## Business Objectives Covered by This Feature",
      "BO-0001: Test business objective",
      "## Acceptance Tests Covering This Feature",
      "AT-0001: GIVEN G, WHEN W, THEN T",
    ])
  })
})
