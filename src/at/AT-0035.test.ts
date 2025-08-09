import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with no issues, WHEN the user runs "s4 status", THEN the system displays the project is in good state', () => {
  // Given a spec with no issues
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays the project is in good state
    expect(result.stdout).toContain(
      "Project is in good state. You don't need to run any other checks since I've already checked everything. You may consult your human colleagues to find out what to do next.",
    )
  } finally {
    cleanupTempFile(tempFile)
  }
})
