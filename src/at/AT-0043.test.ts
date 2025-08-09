import { cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec, WHEN the user runs "s4 status", THEN the system displays the project title, mission, and vision', () => {
  // Given a spec
  const spec = createSpec()
  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays the project title, mission, and vision in the summarized context section
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContain("# Test Specification")
    expect(output).toContain("- Mission: Test mission")
    expect(output).toContain("- Vision: Test vision")
  } finally {
    cleanupTempFile(tempFile)
  }
})
