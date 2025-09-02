import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with duplicate concept labels, WHEN the user runs "s4 validate", THEN error messages show which concept labels are duplicated and provide actionable guidance', () => {
  const result = runSpec(
    {
      concepts: [
        { id: "Test Concept", description: "A test concept" },
        { id: "Test Concept", description: "A duplicate test concept" },
      ],
    },
    "validate --spec SPEC_FILE",
  )
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('[duplicate_concept] Concept "Test Concept" is defined multiple times.')
})
