import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with tools where a preceding tool has stopOnError set to true and exits with non-zero, WHEN the user runs "s4 tools", THEN the system stops executing subsequent tools after the failing tool', () => {
  // Given a spec where first tool fails and should stop the sequence
  const spec = makeSpec({
    tools: [
      { id: "first", command: 'echo "FIRST"; false', stopOnError: true },
      { id: "second", command: 'echo "SECOND"', stopOnError: false },
    ],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs all tools
    const result = runS4(`tools --spec ${tempFile}`)

    // Then the system stops executing subsequent tools after the failing tool
    expect(result.status).toBe(1)
    expect(result.stdout).toContainInOrder(["✘ first: failure", "⚠ second: skipped"])
  } finally {
    cleanupTempFile(tempFile)
  }
})
