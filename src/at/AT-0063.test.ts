import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runS4 } from "../test-utils.ts"

it('GIVEN no spec file exists in the current directory, WHEN the user runs "s4 status", THEN the system displays that the spec file has to be created first and suggest to run "s4 guide"', () => {
  const dir = mkdtempSync(join(tmpdir(), "s4-at-0063-"))
  try {
    const result = runS4("status", { cwd: dir })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain("Failed to read spec file: s4.yaml")
    expect(result.stderr).toContain('Spec file "s4.yaml" does not exist in the current directory.')
    expect(result.stderr).toContain('Run "s4 guide"')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
