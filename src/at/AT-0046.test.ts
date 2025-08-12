import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a tool "sometool", WHEN the user runs "s4 tool sometool" and the tool exits with code 0, THEN the system returns exit code 0', () => {
  runSpec({ tools: [{ id: "sometool", command: 'echo "Tool ran successfully"' }] }, "tool sometool --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
  })
})
