import { runS4 } from "../test-utils.ts"

it('GIVEN in any occasion, WHEN the user runs "s4 example", THEN the system displays a simple example specification in YAML format', () => {
  const result = runS4("example")

  expect(result.status).toBe(0)
  // Assert that the output contains YAML structure elements
  expect(result.stdout).toContain("title:")
  expect(result.stdout).toContain("mission:")
  expect(result.stdout).toContain("businessObjectives:")
  expect(result.stdout).toContain("features:")
  expect(result.stdout).toContain("acceptanceTests:")
})
