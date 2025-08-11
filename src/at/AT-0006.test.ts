import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with uncovered [[Business Objective]]s, WHEN the user runs "s4 validate", THEN error messages show which BO-#### IDs lack covering features and provide actionable guidance', () => {
  // Given a spec with uncovered business objectives
  const spec = makeSpec({
    businessObjectives: [
      { id: "BO-0001", description: "Covered business objective" },
      { id: "BO-0002", description: "Uncovered business objective" }, // Not covered by any feature
    ],
    features: [{ id: "FE-0001", title: "Test Feature", description: "Test feature", covers: ["BO-0001"] }],
  })
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate"
    const result = runS4(`validate --spec ${tempFile}`)

    // The command should fail with validation issues
    expect(result.status).toBe(1)

    // Should contain specific validation issue messages with guidance
    expect(result.stderr).toContain("[uncovered_item] Business objective BO-0002 is not covered by any feature.")
  } finally {
    cleanupTempFile(tempFile)
  }
})
