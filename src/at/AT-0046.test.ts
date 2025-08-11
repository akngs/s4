import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a tool "sometool", WHEN the user runs "s4 tool sometool" and the tool exits with code 0, THEN the system returns exit code 0', () => {
  // Given a spec with a tool "sometool"
  const spec = makeSpec({
    tools: [{ id: "sometool", command: 'echo "Tool ran successfully"' }],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 tool sometool"
    const result = runS4(`tool sometool --spec ${tempFile}`)

    // Then the system executes the tool and returns the results as is
    // Once implemented, the command should succeed and pass through stdout/stderr/exit code as-is
    expect(result.status).toBe(0)
  } finally {
    cleanupTempFile(tempFile)
  }
})
