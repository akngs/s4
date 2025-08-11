import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with multiple tools, WHEN the user runs "s4 status", THEN the system runs all tools at the end of the process', () => {
  // Given a spec with ordered tools
  const spec = makeSpec({
    tools: [
      { id: "t1", command: 'echo "T1"' },
      { id: "t2", command: 'echo "T2"' },
    ],
  })
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs status
    const result = runS4(`status --spec ${tempFile}`)

    // Then tools are run at the end; outputs appear at the end in order
    expect(result.status).toBe(0)
    // We render a summarized Tools section with success/failure, not raw outputs
    expect(result.stdout).toContainInOrder(["✔ t1: success", "✔ t2: success"])
  } finally {
    cleanupTempFile(tempFile)
  }
})
