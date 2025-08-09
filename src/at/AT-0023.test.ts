import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with invalid concept references in descriptions, WHEN the user runs "s4 validate", THEN error messages show which items reference undefined concepts and provide actionable guidance', () => {
  // Given a spec with invalid concept references in descriptions
  const spec = createSpec({ businessObjectives: [{ id: "BO-0001", description: "BO with [[Unknown]] concept" }] })
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 validate --spec spec.yaml"
    const result = runS4(`validate --spec ${tempFile}`)

    // Then specific error messages indicate which items reference undefined concepts
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('[invalid_concept_ref] BO-0001 references undefined concept "Unknown".')
  } finally {
    cleanupTempFile(tempFile)
  }
})
