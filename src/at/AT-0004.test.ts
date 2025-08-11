import { runSpec } from "../test-utils.ts"

it('GIVEN a spec in YAML format, WHEN the user runs "s4 validate --spec spec.yaml --format yaml", THEN the spec is successfully parsed and validated', () => {
  runSpec({}, "validate --format yaml --spec SPEC_FILE", result => {
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("")
  })
})
