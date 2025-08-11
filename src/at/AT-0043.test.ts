import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays the project title, mission, and vision', () => {
  // Given a spec
  const spec = makeSpec()
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays the project title, mission, and vision in the summarized context section
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContainInOrder(["# Test Specification", "- Mission: Test mission", "- Vision: Test vision"])
  } finally {
    cleanupTempFile(tempFile)
  }
})
