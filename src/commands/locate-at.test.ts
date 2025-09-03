import { makeSpec } from "../test-utils.ts"
import locateAt from "./locate-at.ts"

it("locate-at command should succeed with valid acceptance test ID", async () => {
  const spec = makeSpec()
  const result = await locateAt(spec, "AT-0001")
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe("src/at/AT-0001.test.ts")
})

it("locate-at command should handle non-existent acceptance test ID", async () => {
  const spec = makeSpec()
  const result = await locateAt(spec, "AT-9999")
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe("src/at/AT-9999.test.ts")
})
