import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with no structural issues, WHEN the user runs "s4 validate", THEN the command exits successfully with no errors', () => {
  // Given a spec with no structural issues
  const spec = makeSpec()
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate"
    const result = runS4(`validate --spec ${tempFile}`)

    // The command should exit successfully with no issues
    expect(result.status).toBe(0)
  } finally {
    cleanupTempFile(tempFile)
  }
})
