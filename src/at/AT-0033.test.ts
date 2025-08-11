import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a failing tool, WHEN the user runs "s4 status", THEN the system displays the tool failure', () => {
  // Given a spec with a failing tool
  const spec = makeSpec({
    tools: [
      {
        id: "lint",
        command: "echo 'Lint errors found'; exit 1",
        stopOnError: true,
        recommendedNextActions: "Fix the lint errors and run the tool again",
      },
    ],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays the tool failure
    expect(result.stdout).toContain("Lint errors found")
    expect(result.stdout).toContain("Fix the lint errors and run the tool again")
  } finally {
    cleanupTempFile(tempFile)
  }
})
