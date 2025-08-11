import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with no feature "FE-9999", WHEN the user runs "s4 info FE-9999", THEN the system displays an error indicating that the feature does not exist', () => {
  // Given a spec with no feature 'FE-9999'
  const spec = makeSpec()
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 info FE-9999"
    const result = runS4(`info FE-9999 --spec ${tempFile}`)
    // If we reach here and status is 0, the command didn't fail as expected
    if (result.status === 0) {
      expect.fail("Command should have failed with an error")
    }
    // Then the system displays an error indicating that the feature does not exist
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContain('Feature "FE-9999" not found')
  } finally {
    cleanupTempFile(tempFile)
  }
})
