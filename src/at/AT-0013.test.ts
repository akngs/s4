import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 run-at AT-####", THEN the system executes the specified acceptance test and returns the results', () => {
  const specOverrides = {
    connectors: {
      listAcceptanceTests: 'echo "AT-0001: Test"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Test passed"',
      runAcceptanceTests: 'echo "All tests passed"',
    },
  }

  runSpec(specOverrides, "run-at AT-0001 --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("Test passed")
  })
})
