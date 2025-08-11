import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a failing tool, WHEN the user runs "s4 status", THEN the system displays the tool failure', () => {
  const specOverrides = {
    tools: [
      {
        id: "lint",
        command: "echo 'Lint errors found'; exit 1",
        stopOnError: true,
        recommendedNextActions: "Fix the lint errors and run the tool again",
      },
    ],
  }

  runSpec(specOverrides, "status --spec SPEC_FILE", result => {
    expect(result.stdout).toContainInOrder(["Lint errors found", "Fix the lint errors and run the tool again"])
  })
})
