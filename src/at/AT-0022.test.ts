import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with duplicate concept labels, WHEN the user runs "s4 validate", THEN error messages show which concept labels are duplicated and provide actionable guidance', () => {
  // Given a spec with duplicate concept labels
  const spec = createSpec({
    concepts: [
      { id: "Test Concept", description: "A test concept" },
      { id: "Test Concept", description: "A duplicate test concept" },
    ],
  })
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 validate --spec spec.yaml"
    const result = runS4(`validate --spec ${tempFile}`)

    // Then specific error messages indicate which concept labels are duplicated
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('[duplicate_concept] Concept "Test Concept" is defined multiple times.')
  } finally {
    cleanupTempFile(tempFile)
  }
})
