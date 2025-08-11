import { runSpec } from "../test-utils.ts"

it('GIVEN a spec file, WHEN the user runs "s4 validate --spec path-and-filename", THEN the spec is read from the file', () => {
  runSpec({}, "validate --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
    expect(result.stderr).not.toContain(`io_error: Failed to read spec file`)
  })
})
