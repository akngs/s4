import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with unused concepts, WHEN the user runs "s4 validate", THEN error messages show which concepts are defined but never referenced and provide actionable guidance', () => {
  const specOverrides = {
    concepts: [
      { id: "Used Concept", description: "A concept that is used" },
      { id: "Unused Concept", description: "A concept that is not used anywhere" },
    ],
    businessObjectives: [{ id: "BO-0001", description: "Test business objective with [[Used Concept]] reference" }],
    features: [{ id: "FE-0001", title: "Feature 1", description: "A feature uses the [[Used Concept]]", covers: ["BO-0001"] }],
  }

  runSpec(specOverrides, "validate --spec SPEC_FILE", result => {
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('[unused_concept] Concept "Unused Concept" is not used in the spec.')
  })
})
