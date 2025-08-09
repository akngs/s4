import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec in JSON format, WHEN the user runs "s4 validate --spec spec.json --format json", THEN the spec is successfully parsed and validated', () => {
  // Given a spec in JSON format
  const spec = createSpec()
  const tempFile = createTempFile(spec, "json")

  try {
    // When the user runs "s4 validate --spec spec.json --format json"
    const result = runS4(`validate --format json --spec ${tempFile}`)

    // Then the spec is successfully parsed and validated
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("")
  } finally {
    cleanupTempFile(tempFile)
  }
})
