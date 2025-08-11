import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no [[Business Objective]]s defined, WHEN the user runs "s4 validate", THEN error messages show that the spec has at least one [[Business Objective]] defined and provide actionable guidance', () => {
  const specOverrides = { businessObjectives: [], features: [], acceptanceTests: [] }

  runSpec(specOverrides, "validate --spec SPEC_FILE", result => {
    expect(result.status).toBe(1)
    expect(result.stderr).toContainInOrder([
      "[missing_section] The spec must define at least one Business Objective.",
      "Run `s4 guide businessObjective`",
    ])
  })
})
