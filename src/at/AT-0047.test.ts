import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a tool "sometool", WHEN the user runs "s4 tool sometool" and the tool exits with non-zero code, THEN the system returns exit code 1 and provides custom message defined in "recommendedNextActions" field', () => {
  const specOverrides = {
    tools: [{ id: "sometool", command: 'echo "COMMAND OUTPUT"; false', recommendedNextActions: "CUSTOM MESSAGE" }],
  }

  runSpec(specOverrides, "tool sometool --spec SPEC_FILE", result => {
    expect(result.status).toBe(1)
    expect(result.stdout).toContainInOrder(["COMMAND OUTPUT", "CUSTOM MESSAGE"])
    expect(result.stderr).toBe("")
  })
})
