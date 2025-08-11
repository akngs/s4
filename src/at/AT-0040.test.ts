import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with an acceptance test "AT-0001", WHEN the user runs "s4 info AT-0001", THEN the system displays detailed information about the acceptance test in markdown format', () => {
  // Given a spec with an acceptance test 'AT-0001'
  const spec = makeSpec()
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 info AT-0001"
    const result = runS4(`info AT-0001 --spec ${tempFile}`)
    // Then the system displays detailed information about the acceptance test in markdown format
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContain("# AT-0001")
    expect(output).toContain("GIVEN G, WHEN W, THEN T")
    expect(output).toContain("## Feature Covered by This Acceptance Test")
    expect(output).toContain("FE-0001: Test Feature")
    expect(output).toContain("## Related Business Objectives")
    expect(output).toContain("BO-0001: Test business objective")
  } finally {
    cleanupTempFile(tempFile)
  }
})
