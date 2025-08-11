import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with multiple tools defined in order (e.g., "tool1", then "tool2"), WHEN the user runs "s4 tools", THEN the system executes all tools in the defined order', () => {
  // Given a spec with two tools in a specific order
  const spec = makeSpec({
    tools: [
      { id: "tool1", command: 'echo "TOOL1"', stopOnError: false },
      { id: "tool2", command: 'echo "TOOL2"', stopOnError: false },
    ],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs all tools
    const result = runS4(`tools --spec ${tempFile}`)

    // Then tools are executed in order and outputs are combined in order
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("✔ tool1: success")
    expect(result.stdout).toContain("✔ tool2: success")
  } finally {
    cleanupTempFile(tempFile)
  }
})
