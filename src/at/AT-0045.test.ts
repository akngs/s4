import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays a list of all features with their completion stats', () => {
  // Given a spec
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays a list of all features with their completion stats based on passing acceptance tests in the summarized context section
    expect(result.stdout).toContain("✔ FE-0001: Test Feature (1/1)")
  } finally {
    cleanupTempFile(tempFile)
  }
})
