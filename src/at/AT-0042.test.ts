import { runSpec } from "../test-utils.ts"

it('GIVEN a spec file "s4.yaml" exists in the current directory, WHEN the user runs "s4 validate" without specifying --spec, THEN the system reads from "s4.yaml" by default', () => {
  expect(runSpec({}, "validate")).toMatchObject({ status: 0 })
})
