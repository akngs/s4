import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { stringify } from "yaml"
import { createSpec, runS4 } from "../test-utils.ts"

it('GIVEN a spec file "s4.yaml" exists in the current directory, WHEN the user runs "s4 validate" without specifying --spec, THEN the system reads from "s4.yaml" by default', () => {
  // Create a temporary directory
  const tempDir = mkdtempSync(join(tmpdir(), "s4-test-"))

  // Create a spec and write it as s4.yaml in the temp directory
  const spec = createSpec()
  const yamlContent = stringify(spec)
  const tempFilePath = join(tempDir, "s4.yaml")
  writeFileSync(tempFilePath, yamlContent, "utf-8")

  try {
    // When the user runs "s4 validate" without specifying --spec
    const result = runS4("validate", { encoding: "utf-8", cwd: tempDir })

    // Then the system reads from "s4.yaml" by default and validates successfully
    // Ensure the command succeeded (defaulted to s4.yaml) and no IO/parse errors occurred
    expect(result.status).toBe(0)
    expect(result.stderr).not.toContain("io_error:")
    expect(result.stderr).not.toContain("parse_error:")
  } finally {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true })
  }
})
