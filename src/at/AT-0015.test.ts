import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 run-ats", THEN the system executes all acceptance tests and returns the results', () => {
  // Create a spec content with a tools configuration
  const spec = makeSpec()
  const tempFile = makeTempFile(spec)

  try {
    // Test run-ats command with spec file
    const result = runS4(`run-ats --spec ${tempFile}`)

    // Should execute successfully and return the expected output
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("All acceptance tests are passing")
  } finally {
    cleanupTempFile(tempFile)
  }
})
