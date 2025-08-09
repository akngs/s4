import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec in YAML format, WHEN the user runs "s4 validate --spec spec.yaml --format yaml", THEN the spec is successfully parsed and validated', () => {
  // Given a spec in YAML format
  const spec = createSpec()
  const tempFile = createTempFile(spec, "yaml")

  try {
    // When the user runs "s4 validate --spec spec.yaml --format yaml"
    const result = runS4(`validate --format yaml --spec ${tempFile}`)

    // Then the spec is successfully parsed and validated
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("")
  } finally {
    cleanupTempFile(tempFile)
  }
})
