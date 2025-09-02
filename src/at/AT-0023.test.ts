import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with invalid concept references in descriptions, WHEN the user runs "s4 validate", THEN error messages show which items reference undefined concepts and provide actionable guidance', () => {
  const result = runSpec({ businessObjectives: [{ id: "BO-0001", description: "BO with [[Unknown]] concept" }] }, "validate --spec SPEC_FILE")
  expect(result.status).toBe(1)
  expect(result.stderr).toContainInOrder(['[invalid_concept_ref] BO-0001 references undefined concept "Unknown".'])
})
