import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 run-at AT-####", THEN the system executes the specified acceptance test and returns the results', () => {
  // Create a spec with a tools configuration
  const spec = createSpec({
    connectors: {
      listAcceptanceTests: 'echo "AT-0001: Test"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Test passed"',
      runAcceptanceTests: 'echo "All tests passed"',
    },
  })
  const tempFile = createTempFile(spec)

  try {
    // Run the specified acceptance test
    const result = runS4(`run-at AT-0001 --spec ${tempFile}`)

    // Should execute the test and return results
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("Test passed")
  } finally {
    cleanupTempFile(tempFile)
  }
})
