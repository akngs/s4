import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no structural issues, WHEN the user runs "s4 validate", THEN the command exits successfully with no errors', () => {
  const result = runSpec({}, "validate --spec SPEC_FILE")
  expect(result.status).toBe(0)
})
