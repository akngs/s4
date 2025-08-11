import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with no [[Business Objective]]s defined, WHEN the user runs "s4 validate", THEN error messages show that the spec has at least one [[Business Objective]] defined and provide actionable guidance', () => {
  // Given a spec with no business objectives defined
  const spec = makeSpec({ businessObjectives: [], features: [], acceptanceTests: [] })
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate"
    const result = runS4(`validate --spec ${tempFile}`)

    // The command should fail with validation issues
    expect(result.status).toBe(1)

    // Should contain specific validation message with guidance
    const output = result.stderr
    expect(output).toContainInOrder(["[missing_section] The spec must define at least one Business Objective.", "Run `s4 guide businessObjective`"])
  } finally {
    cleanupTempFile(tempFile)
  }
})
