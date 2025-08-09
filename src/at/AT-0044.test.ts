import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays all business objectives', () => {
  // Given a spec
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays all business objectives in the summarized context section
    expect(result.stdout).toContain("- BO-0001: Test business objective")
  } finally {
    cleanupTempFile(tempFile)
  }
})
