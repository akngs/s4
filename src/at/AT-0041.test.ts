import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with no acceptance test "AT-9999", WHEN the user runs "s4 info AT-9999", THEN the system displays an error indicating that the acceptance test does not exist', () => {
  runSpec({}, "info AT-9999 --spec SPEC_FILE", result => {
    if (result.status === 0) expect.fail("Command should have failed with an error")
    const output = result.stdout || result.stderr || result.error?.message || ""
    expect(output).toContain('Acceptance test "AT-9999" not found in spec')
  })
})
