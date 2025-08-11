import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with internal inconsistencies, WHEN the user runs "s4 status", THEN the system displays all detected issues along with actionable guidance for each', () => {
  // Given a spec with internal inconsistencies
  const spec = makeSpec({
    businessObjectives: [
      { id: "BO-0001", description: "Test business objective" },
      { id: "BO-0002", description: "Uncovered business objective" },
    ],
    features: [
      { id: "FE-0001", title: "Test Feature", description: "Test feature description", covers: ["BO-0001"] },
      {
        id: "FE-0002",
        title: "Feature with invalid prereq",
        description: "Feature with invalid prerequisite",
        covers: ["BO-0001"],
        prerequisites: ["FE-9999"],
      },
      {
        id: "FE-0003",
        title: "Feature with invalid BO",
        description: "Feature with invalid business objective",
        covers: ["BO-9999"],
        prerequisites: [],
      },
      {
        id: "FE-0004",
        title: "Uncovered feature",
        description: "Feature not covered by any acceptance test",
        covers: ["BO-0001"],
        prerequisites: [],
      },
    ],
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
      { id: "AT-0002", covers: "FE-9999", given: "G", when: "W", then: "T with invalid feature reference" },
    ],
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 status"
    const result = runS4(`status --spec ${tempFile}`)

    // Then the system displays all detected issues along with actionable guidance for each
    expect(result.stdout).toMatch(/There are \d+ validation issues - the spec has internal inconsistencies\./)

    // Check for specific validation issues and their guidance
    expect(result.stdout).toContain("[uncovered_item] Business objective BO-0002 is not covered by any feature")
    expect(result.stdout).toContain("Define a new feature that covers BO-0002")

    expect(result.stdout).toContain("[uncovered_item] Feature FE-0004 is not covered by any acceptance test")
    expect(result.stdout).toContain("Add a new acceptance test that covers FE-0004")

    expect(result.stdout).toContain("[invalid_prereq] Feature FE-0002 has a prerequisite FE-9999 that is not defined")
    expect(result.stdout).toContain("Define the prerequisite feature FE-9999")

    expect(result.stdout).toContain("[invalid_bo] Feature FE-0003 references unknown business objective BO-9999")
    expect(result.stdout).toContain("Define the business objective BO-9999")

    expect(result.stdout).toContain("[invalid_fe] Acceptance test AT-0002 references unknown feature FE-9999")
    expect(result.stdout).toContain("Define the feature FE-9999")
  } finally {
    cleanupTempFile(tempFile)
  }
})
