import { cleanupTempFile, makeSpec, makeTempFile, runS4 } from "../test-utils.ts"

it('GIVEN a spec with multiple structural issues, WHEN the user runs "s4 validate", THEN all validation issues are detected and reported', () => {
  // Given a spec with structural issues
  const spec = makeSpec({
    concepts: [
      { id: "Y", description: "Test concept Y" }, // Duplicate concept
      { id: "Y", description: "Test concept Y" }, // Duplicate concept
    ],
    businessObjectives: [
      { id: "BO-0001", description: "Test business objective with [[X]] concept reference" }, // References undefined concept X
      { id: "BO-0001", description: "Duplicate business objective" }, // Duplicate ID
      { id: "BO-0002", description: "Uncovered business objective" }, // Not covered by any feature
    ],
    features: [
      {
        id: "FE-0001",
        title: "Test Feature 1",
        description: "Test feature with [[X]] concept reference",
        covers: ["BO-0001"],
        prerequisites: ["FE-0002"],
      }, // References undefined concept X, circular dependency
      { id: "FE-0002", title: "Test Feature 2", description: "Test feature", covers: ["BO-0001"], prerequisites: ["FE-0001"] }, // Creates circular dependency with FE-0001
    ],
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T with [[X]] concept reference" }, // References undefined concept X
    ],
    connectors: {
      listAcceptanceTests: 'echo "AT-0001: GIVEN G, WHEN W, THEN T"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Done"',
      runAcceptanceTests: 'echo "ok 1 - src/at/AT-0001.test.ts > GIVEN G, WHEN W, THEN T"',
    },
  })

  const tempFile = makeTempFile(spec)

  try {
    // When the user runs "s4 validate"
    const result = runS4(`validate --spec ${tempFile}`)

    // The command should fail with validation issues
    expect(result.status).toBe(1)

    // Error messages should be reported
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toBeTruthy()
    expect(output.length).toBeGreaterThan(0)

    // Check for various types of validation issues that should be present in the invalid spec
    expect(output).toContain("[uncovered_item] Business objective BO-0002 is not covered by any feature.")
    expect(output).toContain("[uncovered_item] Feature FE-0002 is not covered by any acceptance test.")
    expect(output).toContain("[circular_dep] Circular dependency detected involving feature FE-0001.")
    expect(output).toContain("[circular_dep] Circular dependency detected involving feature FE-0002.")
    expect(output).toContain('[invalid_concept_ref] BO-0001 references undefined concept "X".')
    expect(output).toContain('[invalid_concept_ref] FE-0001 references undefined concept "X".')
    expect(output).toContain('[invalid_concept_ref] AT-0001 references undefined concept "X".')
    expect(output).toContain("[duplicate_id] ID BO-0001 is duplicated.")
    expect(output).toContain('[duplicate_concept] Concept "Y" is defined multiple times.')
    expect(output).toContain('[unused_concept] Concept "Y" is not used in the spec.')
  } finally {
    cleanupTempFile(tempFile)
  }
})
