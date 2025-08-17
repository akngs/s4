import { describe, expect, it } from "vitest"
import { unwrapRight } from "../types.ts"
import { getGuidelineView } from "./guide.ts"

describe("getGuidelineView()", () => {
  it("returns brief guidance when no section is provided", async () => {
    const res = await getGuidelineView()
    expect(res._tag).toBe("right")
    const view = (res as { _tag: "right"; R: { kind: string; brief: string } }).R
    expect(view.kind).toBe("brief")
    expect(typeof view.brief).toBe("string")
    expect(view.brief.length).toBeGreaterThan(10)
  })

  it("returns unknown_section with allowed keys when section is invalid", async () => {
    const res = await getGuidelineView("not-a-real-section")
    expect(res._tag).toBe("right")
    const view = (res as { _tag: "right"; R: { kind: string; allowed: string[] } }).R
    expect(view.kind).toBe("unknown_section")
    expect(view.allowed).toEqual(
      expect.arrayContaining(["title", "mission", "vision", "businessObjective", "feature", "acceptanceTest", "connectors", "tools"]),
    )
  })

  it("returns section text and examples for a valid scalar section (title)", async () => {
    const res = await getGuidelineView("title")
    expect(res._tag).toBe("right")
    const view = unwrapRight(res)
    if (view.kind !== "section") throw new Error(`Expected section, got ${view.kind}`)
    // Expect scalar examples like project names from examples in guideline.yaml
    const texts = view.examples.map(e => e.text)
    expect(view.examples.every(e => e.kind === "scalar")).toBe(true)
    expect(texts).toEqual(expect.arrayContaining(["HabitFlow", "NoteNest"]))
  })
})
