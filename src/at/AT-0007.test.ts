import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with circular feature dependencies, WHEN the user runs "s4 validate", THEN circular dependency is detected and reported with feature IDs', () => {
  // Given a spec with circular feature dependencies
  const spec = makeSpec({
    features: [
      { id: "FE-0004", title: "Feature 4", description: "Test feature", covers: ["BO-0001"], prerequisites: ["FE-0005"] },
      { id: "FE-0005", title: "Feature 5", description: "Test feature", covers: ["BO-0001"], prerequisites: ["FE-0004"] }, // Creates circular dependency with FE-0004
    ],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate"
    const result = runS4(`validate --spec ${tempFile}`)

    // The command should fail with validation issues
    expect(result.status).toBe(1)

    // Should contain specific validation issue messages with guidance
    expect(result.stderr).toContainInOrder(["[circular_dep] Circular dependency detected involving feature FE-0004."])
  } finally {
    cleanupTempFile(tempFile)
  }
})
