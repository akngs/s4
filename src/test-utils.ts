import { type SpawnSyncOptions, type SpawnSyncReturns, spawnSync } from "node:child_process"
import { unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { stringify } from "yaml"
import { type S4, S4Schema } from "./types.ts"

/**
 * Creates a temporary file path for a given extension.
 * @param extension - The file extension to use in the temp file name
 * @returns An absolute temporary file path
 */
function generateTempFilePath(extension: string): string {
  const tempDir = tmpdir()
  const base36 = 36
  return join(tempDir, `s4-test-${Date.now()}-${Math.random().toString(base36).substring(2)}.${extension}`)
}

/**
 * Writes text content to a file path using UTF-8 encoding.
 * @param path - Absolute path to write the file to
 * @param content - Text content to write
 */
function writeTextFile(path: string, content: string): void {
  writeFileSync(path, content, "utf-8")
}

/**
 * Archetypal spec object that can be used as a base for all acceptance tests
 */
export const ARCHETYPAL_SPEC: S4 = {
  title: "Test Specification",
  mission: "Test mission",
  vision: "Test vision",
  concepts: [],
  businessObjectives: [{ id: "BO-0001", description: "Test business objective" }],
  features: [{ id: "FE-0001", title: "Test Feature", description: "Test feature description", covers: ["BO-0001"], prerequisites: [] }],
  acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" }],
  tools: [],
  connectors: {
    listAcceptanceTests: 'echo "AT-0001: GIVEN G, WHEN W, THEN T"',
    locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
    runAcceptanceTest: 'echo "Done"',
    runAcceptanceTests: 'echo "ok 1 - src/at/AT-0001.test.ts > GIVEN G, WHEN W, THEN T"',
  },
}

/**
 * Creates a spec object based on the archetypal spec with optional overrides
 * @param overrides - Object containing properties to override in the archetypal spec
 * @returns A new spec object with the overrides applied
 */
export function makeSpec(overrides: Record<string, unknown> = {}): S4 {
  return S4Schema.parse({ ...ARCHETYPAL_SPEC, ...overrides })
}

/**
 * A disposable temporary file that automatically cleans up when disposed
 */
class TempFile implements Disposable {
  constructor(public readonly path: string) {}

  [Symbol.dispose](): void {
    try {
      unlinkSync(this.path)
    } catch {
      // Ignore errors if file doesn't exist
    }
  }
}

/**
 * Runs the s4 CLI with the provided argument string.
 * - Locally it executes the installed binary `s4`.
 * - In GitHub CI it executes `node dist/index.js` to avoid relying on PATH/bin linking.
 * @param args - Full argument string after the executable, e.g. "validate --spec path".
 * @param options - Optional spawn options like `cwd`.
 * @returns Child process result with utf-8 encoded stdio.
 */
export function runS4(args: string, options: SpawnSyncOptions = {}): SpawnSyncReturns<string> {
  const isGitHubCI = process.env["GITHUB_ACTIONS"] === "true" || process.env["CI"] === "true"
  // Use an absolute path in CI so changing cwd won't break resolution of dist/index.js
  const distIndexAbsolute = fileURLToPath(new URL("../dist/index.js", import.meta.url))
  const command = isGitHubCI ? `node "${distIndexAbsolute}" ${args}` : `s4 ${args}`

  const mergedOptions: SpawnSyncOptions = {
    encoding: "utf-8",
    shell: true,
    ...options,
  }

  return spawnSync(command, mergedOptions) as SpawnSyncReturns<string>
}

/**
 * Runs the s4 CLI against a temporary spec derived from the archetypal spec and provided overrides.
 * - Creates a spec using `makeSpec(overrides)`
 * - Writes it to a temporary file
 * - Replaces all occurrences of the token `SPEC_FILE` in the provided command template with the temp file path
 * - Executes the command via `runS4()` and returns the result
 * - Ensures the temporary file is removed after execution
 * @param overrides - Overrides to apply to the archetypal spec
 * @param commandTemplate - Command template where `SPEC_FILE` will be replaced by the temp spec file path
 * @returns The CLI execution result
 */
export function runSpec(overrides: Record<string, unknown>, commandTemplate: string): SpawnSyncReturns<string> {
  const isJson = /--format\s+json(\s|$)/.test(commandTemplate)
  const extension = isJson ? "json" : "yaml"

  using tempFile = createTempSpecFile(overrides, extension)
  const command = commandTemplate.replace(/SPEC_FILE/g, tempFile.path)
  return runS4(command)
}

/**
 * Creates a temporary spec file with the given overrides and returns the file path.
 * The file will be automatically cleaned up when the returned TempFile is disposed.
 * @param overrides - Overrides to apply to the archetypal spec
 * @param extension - File extension (default: "yaml")
 * @returns A TempFile object that can be disposed to clean up the file
 */
export function createTempSpecFile(overrides?: Record<string, unknown>, extension = "yaml"): TempFile {
  const spec = makeSpec(overrides)
  const content = extension === "json" ? JSON.stringify(spec, null, 2) : stringify(spec)
  const filePath = generateTempFilePath(extension)
  writeTextFile(filePath, content)
  return new TempFile(filePath)
}
