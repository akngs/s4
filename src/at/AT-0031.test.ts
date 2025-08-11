import { ARCHETYPAL_SPEC, cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with dangling acceptance test files, WHEN the user runs "s4 status", THEN the system displays a message that dangling acceptance tests need to be removed first', () => {
  // Given a spec with dangling acceptance test files
  const spec = makeSpec({
    acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "Given A", when: "When B", then: "Then C" }],
    connectors: {
      ...ARCHETYPAL_SPEC.connectors,
      listAcceptanceTests: 'echo "AT-0001: Given A When B Then C"\necho "AT-0002: Given A When B Then C"',
    },
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 status --spec spec.yaml"
    const result = runS4(`status --spec ${tempFile}`)
    // Then the system displays dangling acceptance tests need to be removed first
    expect(result.stdout).toContain("There are 1 dangling acceptance tests - these are not defined in the spec but exist in the filesystem:")
    expect(result.stdout).toContain("- AT-0002: src/at/AT-0002.test.ts")
    expect(result.stdout).toContain("- Remove the test files from the filesystem since the spec is the source of truth.")
  } finally {
    cleanupTempFile(tempFile)
  }
})
