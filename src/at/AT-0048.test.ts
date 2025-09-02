import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with multiple tools defined in order (e.g., "tool1", then "tool2"), WHEN the user runs "s4 tools", THEN the system executes all tools in the defined order', () => {
  const result = runSpec(
    {
      tools: [
        { id: "tool1", command: 'echo "TOOL1"', stopOnError: false },
        { id: "tool2", command: 'echo "TOOL2"', stopOnError: false },
      ],
    },
    "tools --spec SPEC_FILE",
  )
  expect(result.status).toBe(0)
  expect(result.stdout).toContainInOrder(["✔ success tool1", "✔ success tool2"])
})
