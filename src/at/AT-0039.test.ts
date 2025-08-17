import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no feature "FE-9999", WHEN the user runs "s4 info FE-9999", THEN the system displays an error indicating that the feature does not exist', () => {
  runSpec({}, "info FE-9999 --spec SPEC_FILE", result => {
    if (result.status === 0) expect.fail("Command should have failed with an error")
    expect(result.stderr).toContain('Feature "FE-9999" not found')
  })
})
