import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with invalid feature references in acceptance tests, WHEN the user runs "s4 validate", THEN error messages show which acceptance tests reference unknown feature IDs and provide actionable guidance', () => {
  const result = runSpec(
    {
      acceptanceTests: [
        { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
        { id: "AT-0002", covers: "FE-9999", given: "G", when: "W", then: "T" },
      ],
    },
    "validate --spec SPEC_FILE",
  )
  expect(result.status).toBe(1)
  expect(result.stderr).toContain("[invalid_fe] Acceptance test AT-0002 references unknown feature FE-9999.")
})
