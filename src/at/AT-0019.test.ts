import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with invalid business objective references in features, WHEN the user runs "s4 validate", THEN error messages show which features reference unknown business objective IDs and provide actionable guidance', () => {
  const result = runSpec(
    {
      concepts: [{ id: "Test Concept", description: "A test concept" }],
      businessObjectives: [{ id: "BO-0001", description: "Test business objective" }],
      features: [{ id: "FE-0001", title: "Test Feature 1", description: "A test feature", covers: ["BO-9999"] }],
    },
    "validate --spec SPEC_FILE",
  )
  expect(result.stderr).toContainInOrder(["[invalid_bo] Feature FE-0001 references unknown business objective BO-9999."])
})
