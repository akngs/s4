import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with a feature "FE-0001", WHEN the user runs "s4 info FE-0001", THEN the system displays detailed information about the feature in markdown format', () => {
  // Given a spec with a feature 'FE-0001'
  const spec = makeSpec()
  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 info FE-0001"
    const result = runS4(`info FE-0001 --spec ${tempFile}`)
    // Then the system displays detailed information about the feature in markdown format
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContain("# FE-0001: Test Feature")
    expect(output).toContain("Test feature description")
    expect(output).toContain("## Business Objectives Covered by This Feature")
    expect(output).toContain("BO-0001: Test business objective")
    expect(output).toContain("## Acceptance Tests Covering This Feature")
    expect(output).toContain("AT-0001: GIVEN G, WHEN W, THEN T")
  } finally {
    cleanupTempFile(tempFile)
  }
})
