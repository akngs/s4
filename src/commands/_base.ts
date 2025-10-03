import { readFile } from "node:fs/promises"
import { type Either, isLeft, left, right } from "fp-ts/lib/Either.js"
import { parse as parseYaml } from "yaml"
import { renderSystemError, renderValueError } from "../render/index.ts"
import { type CommandReturn, type Left, type S4, S4Schema, type SystemError, type ValueError } from "../types.ts"

/**
 * Deserializes a string into an object based on the specified format
 * @param raw - Raw string content to deserialize
 * @param format - Format of the content (json or yaml)
 * @returns Either a system error or the parsed object
 */
export function deserializeSpec(raw: string, format: "json" | "yaml"): Either<SystemError, unknown> {
  try {
    const result: unknown = format === "json" ? JSON.parse(raw) : parseYaml(raw)
    return right(result)
  } catch (cause) {
    return left({ _tag: "parse_error", message: String(cause), cause })
  }
}

/**
 * Parses an object into a validated S4 spec
 * @param obj - Object to parse and validate
 * @returns Either a system error or the validated S4 spec
 */
export function parseSpec(obj: unknown): Either<SystemError, S4> {
  const parsedOrErr = S4Schema.safeParse(obj)
  if (parsedOrErr.error) {
    return left({ _tag: "parse_error", message: parsedOrErr.error.message, cause: parsedOrErr.error })
  } else {
    return right(parsedOrErr.data)
  }
}

/**
 * Shared utility to read and parse spec from file
 * @param specPath - Path to the spec file
 * @param format - Format of the spec file
 * @returns Either a system error or the loaded S4 spec
 */
export async function loadSpec(specPath: string, format: "json" | "yaml" = "yaml"): Promise<Either<SystemError, S4>> {
  const rawResult = await readSpecFile(specPath)
  if (isLeft(rawResult)) return left(rawResult.left)

  const objResult = deserializeSpec(rawResult.right, format)
  if (isLeft(objResult)) return left(objResult.left)

  const specResult = parseSpec(objResult.right)
  if (isLeft(specResult)) return left(specResult.left)

  return right(specResult.right)
}

/**
 * Convert an error to a command return format
 * @param error - The error to convert
 * @returns Command return with error information
 */
export function errToCommandReturn(error: Left<SystemError | ValueError>): CommandReturn {
  if (error.left._tag === "value_error") {
    return { stdout: "", stderr: `${error.left._tag}: ${renderValueError(error.left)}`, exitCode: 1 }
  } else {
    return { stdout: "", stderr: `${error.left._tag}: ${renderSystemError(error.left)}`, exitCode: 1 }
  }
}

async function readSpecFile(filePath: string): Promise<Either<SystemError, string>> {
  try {
    const content = await readFile(filePath, "utf-8")
    return right(content)
  } catch (err) {
    return left({ _tag: "io_error", filePath, cause: err })
  }
}
