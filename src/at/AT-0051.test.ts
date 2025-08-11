import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with multiple tools, WHEN the user runs "s4 status", THEN the system runs all tools at the end of the process', () => {
  const specOverrides = {
    tools: [
      { id: "t1", command: 'echo "T1"' },
      { id: "t2", command: 'echo "T2"' },
    ],
  }

  runSpec(specOverrides, "status --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
    expect(result.stdout).toContainInOrder(["✔ t1: success", "✔ t2: success"])
  })
})
