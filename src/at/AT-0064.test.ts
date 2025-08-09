import { runS4 } from "../test-utils.ts"

it('GIVEN in any occasion, WHEN the user runs "s4 guide SECTION-NAME", THEN the system displays the content of the section from `guideline.yaml` with examples', () => {
  // Given no special setup is needed

  // When the user runs the guide command with a section
  const result = runS4("guide feature")

  // Then the system displays the section content with examples
  expect(result.status).toBe(0)
  expect(result.stderr).toBe("")
  expect(result.stdout).toContain("Specify buildable units of capability identified as FE-####")
  expect(result.stdout).toContain("## Examples")
})
