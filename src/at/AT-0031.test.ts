import { ARCHETYPAL_SPEC, runSpec } from "../test-utils.ts"

it('GIVEN a spec with dangling acceptance test files, WHEN the user runs "s4 status", THEN the system displays a message that dangling acceptance tests need to be removed first', () => {
  runSpec(
    {
      acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "Given A", when: "When B", then: "Then C" }],
      connectors: {
        ...ARCHETYPAL_SPEC.connectors,
        listAcceptanceTests: 'echo "AT-0001: Given A When B Then C"\necho "AT-0002: Given A When B Then C"',
      },
    },
    "status --spec SPEC_FILE",
    result => {
      expect(result.stdout).toContain("There are 1 dangling acceptance tests - these are not defined in the spec but exist in the filesystem:")
      expect(result.stdout).toContain("- AT-0002: src/at/AT-0002.test.ts")
      expect(result.stdout).toContain("- Remove the test files from the filesystem since the spec is the source of truth.")
    },
  )
})
