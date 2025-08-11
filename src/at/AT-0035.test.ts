import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no issues, WHEN the user runs "s4 status", THEN the system displays the project is in good state', () => {
  runSpec({}, "status --spec SPEC_FILE", result => {
    expect(result.stdout).toContain(
      "Project is in good state. You don't need to run any other checks since I've already checked everything. You may consult your human colleagues to find out what to do next.",
    )
  })
})
