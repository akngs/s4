import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with invalid prerequisite references, WHEN the user runs "s4 validate", THEN error messages show which features reference unknown prerequisite IDs and provide actionable guidance', () => {
  const specOverrides = {
    features: [{ id: "FE-0001", title: "Feature 1", description: "A test feature", covers: ["BO-0001"], prerequisites: ["FE-9999"] }],
  }

  runSpec(specOverrides, "validate --spec SPEC_FILE", result => {
    expect(result.stderr).toContain("[invalid_prereq] Feature FE-0001 has a prerequisite FE-9999 that is not defined in the spec.")
  })
})
