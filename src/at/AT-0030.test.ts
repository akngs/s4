import { ARCHETYPAL_SPEC, cleanupTempFile, createSpec, createTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with missing acceptance test files, WHEN the user runs "s4 status", THEN the system displays a message that missing acceptance tests need to be created first', () => {
  // Given a spec with missing acceptance test files
  const spec = createSpec({
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
      { id: "AT-9999", covers: "FE-0001", given: "G", when: "W", then: "T" },
    ],
    connectors: {
      ...ARCHETYPAL_SPEC.connectors,
      listAcceptanceTests: 'echo "AT-0001: Given A When B Then C"',
    },
  })

  const tempFile = createTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)

    // Then the system displays missing acceptance tests need to be created first
    expect(result.stdout).toContain("There are 1 missing acceptance tests total. Among them AT-9999 has the highest priority:")
    expect(result.stdout).toContain("- [AT-9999] src/at/AT-9999.test.ts")
  } finally {
    cleanupTempFile(tempFile)
  }
})
