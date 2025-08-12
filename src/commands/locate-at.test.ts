import { ARCHETYPAL_SPEC, makeSpec, withTempSpecFile } from "../test-utils.ts"
import locateAt from "./locate-at.ts"

it("locate-at command should succeed with valid acceptance test ID", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    connectors: { ...ARCHETYPAL_SPEC.connectors, locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"' },
  })
  await withTempSpecFile(spec, async tempFile => {
    const result = await locateAt({ id: "AT-0001", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe("src/at/AT-0001.test.ts")
    expect(result.stderr).toBe("")
  })
})

it("locate-at command should handle non-existent acceptance test ID", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" }],
    connectors: { ...ARCHETYPAL_SPEC.connectors, locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"' },
  })
  await withTempSpecFile(spec, async tempFile => {
    const result = await locateAt({ id: "AT-9999", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe("src/at/AT-9999.test.ts")
    expect(result.stderr).toBe("")
  })
})

it("locate-at should return value_error when id is missing", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
  })
  await withTempSpecFile(spec, async tempFile => {
    const result = await locateAt({ id: "", spec: tempFile, format: "yaml" })
    expect(result).toBeError("value_error")
  })
})
