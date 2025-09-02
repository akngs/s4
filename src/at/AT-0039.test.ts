import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no feature "FE-9999", WHEN the user runs "s4 info FE-9999", THEN the system displays an error indicating that the feature does not exist', () => {
  const result = runSpec({}, "info FE-9999 --spec SPEC_FILE")
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('Feature "FE-9999" not found')
})
