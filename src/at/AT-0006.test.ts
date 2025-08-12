import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with uncovered [[Business Objective]]s, WHEN the user runs "s4 validate", THEN error messages show which BO-#### IDs lack covering features and provide actionable guidance', () => {
  runSpec(
    {
      businessObjectives: [
        { id: "BO-0001", description: "Covered business objective" },
        { id: "BO-0002", description: "Uncovered business objective" },
      ],
      features: [{ id: "FE-0001", title: "Test Feature", description: "Test feature", covers: ["BO-0001"] }],
    },
    "validate --spec SPEC_FILE",
    result => {
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("[uncovered_item] Business objective BO-0002 is not covered by any feature.")
    },
  )
})
