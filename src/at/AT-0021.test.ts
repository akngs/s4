import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with duplicate IDs across business objectives, features, and acceptance tests, WHEN the user runs "s4 validate", THEN error messages show which IDs are duplicated and provide actionable guidance', () => {
  // Given a spec with duplicate IDs across business objectives, features, and acceptance tests
  const spec = makeSpec({
    businessObjectives: [
      { id: "BO-0001", description: "Business Objective 1" },
      { id: "BO-0001", description: "Duplicate Business Objective" },
    ],
    features: [
      { id: "FE-0001", title: "Test Feature 1", description: "A feature uses the [[Test Concept]]", covers: ["BO-0001"] },
      { id: "FE-0001", title: "Test Feature 2", description: "A feature with duplicate ID", covers: ["BO-0001"] },
    ],
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
    ],
  })
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate --spec spec.yaml"
    const result = runS4(`validate --spec ${tempFile}`)

    // Then specific error messages indicate which IDs are duplicated
    expect(result.status).toBe(1)
    expect(result.stderr).toContainInOrder([
      "[duplicate_id] ID BO-0001 is duplicated.",
      "[duplicate_id] ID FE-0001 is duplicated.",
      "[duplicate_id] ID AT-0001 is duplicated.",
    ])
  } finally {
    cleanupTempFile(tempFile)
  }
})
