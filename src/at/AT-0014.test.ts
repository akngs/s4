import { runSpec } from "../test-utils.ts"

it('GIVEN a spec with a tools configuration, WHEN the user runs "s4 locate-at AT-####", THEN the system returns the file path for the specified acceptance test', () => {
  runSpec({}, "locate-at AT-0001 --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("src/at/AT-0001.test.ts\n")
  })
})
