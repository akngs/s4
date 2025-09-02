import { ARCHETYPAL_SPEC, createTempSpecFile } from "../test-utils.ts"
import locateAt from "./locate-at.ts"

it("locate-at command should succeed with valid acceptance test ID", async () => {
  using specFile = createTempSpecFile({
    connectors: { ...ARCHETYPAL_SPEC.connectors, locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"' },
  })

  const result = await locateAt({ id: "AT-0001", spec: specFile.path, format: "yaml" })
  expect(result).toMatchObject({ exitCode: 0, stdout: "src/at/AT-0001.test.ts" })
})

it("locate-at command should handle non-existent acceptance test ID", async () => {
  using specFile = createTempSpecFile({
    acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" }],
    connectors: { ...ARCHETYPAL_SPEC.connectors, locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"' },
  })

  const result = await locateAt({ id: "AT-9999", spec: specFile.path, format: "yaml" })
  expect(result).toMatchObject({ exitCode: 0, stdout: "src/at/AT-9999.test.ts" })
})

it("locate-at should return value_error when id is missing", async () => {
  using specFile = createTempSpecFile()
  const result = await locateAt({ id: "", spec: specFile.path, format: "yaml" })
  expect(result).toBeError("value_error")
})
