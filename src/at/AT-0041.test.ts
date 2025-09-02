import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no acceptance test "AT-9999", WHEN the user runs "s4 info AT-9999", THEN the system displays an error indicating that the acceptance test does not exist', () => {
  const result = runSpec({}, "info AT-9999 --spec SPEC_FILE")
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('Acceptance test "AT-9999" not found in spec')
})
