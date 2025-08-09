import { ARCHETYPAL_SPEC, cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with failing acceptance tests, WHEN the user runs "s4 status", THEN the system displays few failing acceptance tests and picks the most important one to fix', () => {
  // Given a spec with failing acceptance tests
  const spec = createSpec({
    connectors: {
      ...ARCHETYPAL_SPEC.connectors,
      runAcceptanceTests: "echo 'not ok 1 - src/at/AT-0001.test.ts > GIVEN A, WHEN B, THEN C'",
    },
  })

  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays few failing acceptance tests and picks the most important one to fix
    expect(result.stdout).toContain("Here are the first few failing acceptance tests:")
    expect(result.stdout).toContain("Among these, the most important one to fix is AT-0001. Here are some details:")
  } finally {
    cleanupTempFile(tempFile)
  }
})
