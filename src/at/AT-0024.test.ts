import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with unused concepts, WHEN the user runs "s4 validate", THEN error messages show which concepts are defined but never referenced and provide actionable guidance', () => {
  // Given a spec with unused concepts
  const spec = createSpec({
    concepts: [
      { id: "Used Concept", description: "A concept that is used" },
      { id: "Unused Concept", description: "A concept that is not used anywhere" },
    ],
    businessObjectives: [{ id: "BO-0001", description: "Test business objective with [[Used Concept]] reference" }],
    features: [{ id: "FE-0001", title: "Feature 1", description: "A feature uses the [[Used Concept]]", covers: ["BO-0001"] }],
  })
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 validate --spec spec.yaml"
    const result = runS4(`validate --spec ${tempFile}`)

    // Then specific error messages indicate which concepts are defined but never referenced
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('[unused_concept] Concept "Unused Concept" is not used in the spec.')
  } finally {
    cleanupTempFile(tempFile)
  }
})
