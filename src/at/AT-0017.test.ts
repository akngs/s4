import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with uncovered [[Feature]]s, WHEN the user runs "s4 validate", THEN error messages show which FE-#### IDs lack covering acceptance tests and provide actionable guidance', () => {
  runSpec(
    {
      features: [
        { id: "FE-0001", title: "Test Feature 1", description: "A test feature", covers: ["BO-0001"] },
        { id: "FE-0002", title: "Test Feature 2", description: "An uncovered test feature", covers: ["BO-0001"] },
      ],
      acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" }],
    },
    "validate --spec SPEC_FILE",
    result => {
      expect(result.stderr).toContainInOrder(["[uncovered_item] Feature FE-0002 is not covered by any acceptance test."])
    },
  )
})
