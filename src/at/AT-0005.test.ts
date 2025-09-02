import { runSpec } from "../test-utils.ts"

it('GIVEN a spec in JSON format, WHEN the user runs "s4 validate --spec spec.json --format json", THEN the spec is successfully parsed and validated', () => {
  expect(runSpec({}, "validate --format json --spec SPEC_FILE")).toMatchObject({ status: 0, stdout: "" })
})
