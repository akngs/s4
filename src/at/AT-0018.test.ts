import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with invalid prerequisite references, WHEN the user runs "s4 validate", THEN error messages show which features reference unknown prerequisite IDs and provide actionable guidance', () => {
  // Given a spec with invalid prerequisite references
  const spec = makeSpec({
    features: [{ id: "FE-0001", title: "Feature 1", description: "A test feature", covers: ["BO-0001"], prerequisites: ["FE-9999"] }],
  })
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate"
    const result = runS4(`validate --spec ${tempFile}`)

    // Then the system displays the spec has invalid prerequisite references
    expect(result.stderr).toContain("[invalid_prereq] Feature FE-0001 has a prerequisite FE-9999 that is not defined in the spec.")
  } finally {
    cleanupTempFile(tempFile)
  }
})
