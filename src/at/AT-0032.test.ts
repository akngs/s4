import { ARCHETYPAL_SPEC, runSpec } from "../test-utils.ts"

it('GIVEN a spec with failing acceptance tests, WHEN the user runs "s4 status", THEN the system displays few failing acceptance tests and picks the most important one to fix', () => {
  runSpec(
    {
      connectors: {
        ...ARCHETYPAL_SPEC.connectors,
        runAcceptanceTests: "echo 'not ok 1 - src/at/AT-0001.test.ts > GIVEN A, WHEN B, THEN C'",
      },
    },
    "status --spec SPEC_FILE",
    result => {
      expect(result.stdout).toContainInOrder([
        "Here are the first few failing acceptance tests:",
        "Among these, the most important one to fix is AT-0001. Here are some details:",
      ])
    },
  )
})
