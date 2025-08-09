import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec file, WHEN the user runs "s4 validate --spec path-and-filename", THEN the spec is read from the file', () => {
  // Given a spec with specific content
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 validate --spec path-and-filename"
    const result = runS4(`validate --spec ${tempFile}`)

    // Then the spec is read from the file and validated successfully
    expect(result.status).toBe(0)
    expect(result.stderr).not.toContain(`io_error: Failed to read spec file`)
  } finally {
    cleanupTempFile(tempFile)
  }
})
