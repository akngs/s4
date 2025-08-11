import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a tool "sometool", WHEN the user runs "s4 tool sometool" and the tool exits with non-zero code, THEN the system returns exit code 1 and provides custom message defined in "recommendedNextActions" field', () => {
  // Given a spec with a failing tool and recommended next actions
  const spec = makeSpec({
    tools: [
      {
        id: "sometool",
        command: 'echo "COMMAND OUTPUT"; false',
        recommendedNextActions: "CUSTOM MESSAGE",
      },
    ],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs the tool
    const result = runS4(`tool sometool --spec ${tempFile}`)

    // Then the system returns the results as is and provides recommended next actions
    expect(result.status).toBe(1)
    // stdout should include the tool output followed by the recommended next actions
    expect(result.stdout).toContainInOrder(["COMMAND OUTPUT", "CUSTOM MESSAGE"])
    // stderr should be passed through without modification (empty in our echo/false example)
    expect(result.stderr).toBe("")
  } finally {
    cleanupTempFile(tempFile)
  }
})
