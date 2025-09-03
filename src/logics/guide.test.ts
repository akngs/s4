import { describe, expect, it } from "vitest"
import { isRight, unwrapRight } from "../types.ts"
import { getGuidelineView } from "./guide.ts"

describe("getGuidelineView()", () => {
  it("returns brief guidance when no section is provided", async () => {
    const res = await getGuidelineView()
    expect(isRight(res)).toBe(true)

    const view = unwrapRight(res)
    if (view.kind !== "brief") throw new Error(`Expected brief, got ${view.kind}`)

    expect(typeof view.brief).toBe("string")
    expect(view.brief.length).toBeGreaterThan(10)
  })

  it("returns unknown_section with allowed keys when section is invalid", async () => {
    const res = await getGuidelineView("not-a-real-section")
    expect(isRight(res)).toBe(true)

    const view = unwrapRight(res)
    if (view.kind !== "unknown_section") throw new Error(`Expected unknown_section, got ${view.kind}`)
    expect.arrayContaining(["title", "mission", "vision", "businessObjective", "feature", "acceptanceTest", "connectors", "tools"])
  })

  it("returns section text and examples for a valid scalar section (title)", async () => {
    const res = await getGuidelineView("title")
    expect(isRight(res)).toBe(true)

    const view = unwrapRight(res)
    if (view.kind !== "section") throw new Error(`Expected section, got ${view.kind}`)

    expect(view.examples.every(e => e.kind === "scalar")).toBe(true)
    expect(view.examples.map(e => e.text)).toEqual(expect.arrayContaining(["HabitFlow", "NoteNest"]))
  })
})
