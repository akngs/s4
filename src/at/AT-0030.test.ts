import { ARCHETYPAL_SPEC, runSpec } from "../test-utils.ts"

it('GIVEN a spec with missing acceptance test files, WHEN the user runs "s4 status", THEN the system displays a message that missing acceptance tests need to be created first', () => {
  runSpec(
    {
      acceptanceTests: [
        { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
        { id: "AT-9999", covers: "FE-0001", given: "G", when: "W", then: "T" },
      ],
      connectors: {
        ...ARCHETYPAL_SPEC.connectors,
        listAcceptanceTests: 'echo "AT-0001: Given A When B Then C"',
      },
    },
    "status --spec SPEC_FILE",
    result => {
      expect(result.stdout).toContainInOrder([
        "There are 1 missing acceptance tests total. Among them AT-9999 has the highest priority:",
        "- [AT-9999] src/at/AT-9999.test.ts",
      ])
    },
  )
})
