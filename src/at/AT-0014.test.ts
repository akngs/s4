import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 locate-at AT-####", THEN the system returns the file path for the specified acceptance test', () => {
  // Create a spec content with a tools configuration
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // Test locate-at command with spec file and AT ID
    const result = runS4(`locate-at AT-0001 --spec ${tempFile}`)

    // Should execute successfully and return the expected file path
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("src/at/AT-0001.test.ts\n")
  } finally {
    cleanupTempFile(tempFile)
  }
})
