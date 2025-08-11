import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with tools where a preceding tool has stopOnError set to true and exits with non-zero, WHEN the user runs "s4 tools", THEN the system stops executing subsequent tools after the failing tool', () => {
  const specOverrides = {
    tools: [
      { id: "first", command: 'echo "FIRST"; false', stopOnError: true },
      { id: "second", command: 'echo "SECOND"', stopOnError: false },
    ],
  }

  runSpec(specOverrides, "tools --spec SPEC_FILE", result => {
    expect(result.status).toBe(1)
    expect(result.stdout).toContainInOrder(["✘ first: failure", "⚠ second: skipped"])
  })
})
