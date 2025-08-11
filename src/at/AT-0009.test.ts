import { ARCHETYPAL_SPEC, runSpec } from "../test-utils.ts"

it('GIVEN a spec with mismatching acceptance tests, WHEN the user runs "s4 status", THEN the system displays a message that the files should be fixed to match the spec', () => {
  // Given a spec with mismatching acceptance tests
  const specOverrides = {
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G1", when: "W1", then: "T1" },
      { id: "AT-0002", covers: "FE-0001", given: "G2", when: "W2", then: "T2" },
    ],
    connectors: {
      ...ARCHETYPAL_SPEC.connectors,
      listAcceptanceTests: 'echo "AT-0001: GIVEN G3, WHEN W3, THEN T3\nAT-0002: GIVEN G4, WHEN W4, THEN T4"',
    },
  }

  runSpec(specOverrides, "status --spec SPEC_FILE", result => {
    expect(result.stdout).toContainInOrder([
      "There are 2 mismatching acceptance tests - the test file description does not match the spec description:",
      '- AT-0001: Expected "GIVEN G1, WHEN W1, THEN T1" but "GIVEN G3, WHEN W3, THEN T3" in src/at/AT-0001.test.ts',
      '- AT-0002: Expected "GIVEN G2, WHEN W2, THEN T2" but "GIVEN G4, WHEN W4, THEN T4" in src/at/AT-0002.test.ts',
      "Update the test file description to match the spec description",
      "Do not change the spec description since the spec is the source of truth",
    ])
  })
})
