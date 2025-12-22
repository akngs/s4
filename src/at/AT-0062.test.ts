import { runS4 } from "../test-utils.ts"

it('GIVEN in any occasion, WHEN the user runs "s4 guide", THEN the system displays the brief from `guideline.yaml`', () => {
  const result = runS4("guide")

  expect(result.status).toBe(0)
  // Assert that a stable phrase from guideline.yaml brief is present in the output
  expect(result.stdout).toContain("Semi-Structured Software Specification is a YAML-based document format that serves as the single source of truth")
})
