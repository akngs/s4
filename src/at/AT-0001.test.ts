import { runSpec } from "../test-utils.ts"

it('GIVEN a spec file, WHEN the user runs "s4 validate --spec path-and-filename", THEN the spec is read from the file', () => {
  const result = runSpec({}, "validate --spec SPEC_FILE")
  expect(result.status).toBe(0)
})
