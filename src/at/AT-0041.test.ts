import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with no acceptance test "AT-9999", WHEN the user runs "s4 info AT-9999", THEN the system displays an error indicating that the acceptance test does not exist', () => {
  // Given a spec with no acceptance test 'AT-9999'
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 info AT-9999"
    const result = runS4(`info AT-9999 --spec ${tempFile}`)
    // If we reach here and status is 0, the command didn't fail as expected
    if (result.status === 0) {
      expect.fail("Command should have failed with an error")
    }
    // Then the system displays an error indicating that the acceptance test does not exist
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContain('Acceptance test "AT-9999" not found in spec')
  } finally {
    cleanupTempFile(tempFile)
  }
})
