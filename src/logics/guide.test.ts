import { describe, expect, it } from "vitest"
import { unwrapLeft, unwrapRight } from "../test-utils.ts"
import { getGuidelineView } from "./guide.ts"

describe("getGuidelineView()", () => {
  it("returns brief guidance when no section is provided", async () => {
    const res = await getGuidelineView()
    const view = unwrapRight(res)
    if (view._tag !== "brief") throw new Error(`Expected brief, got ${view._tag}`)

    expect(typeof view.brief).toBe("string")
    expect(view.brief.length).toBeGreaterThan(10)
  })

  it("returns unknown_section with allowed keys when section is invalid", async () => {
    const res = await getGuidelineView("not-a-real-section")
    const err = unwrapLeft(res)
    expect(err._tag).toBe("unknown_section")
  })

  it("returns section text and examples for a valid scalar section (title)", async () => {
    const res = await getGuidelineView("title")
    const view = unwrapRight(res)
    if (view._tag !== "section") throw new Error(`Expected section, got ${view._tag}`)

    expect(view.examples.every(e => e._tag === "scalar")).toBe(true)
    expect(view.examples.map(e => e.text)).toEqual(expect.arrayContaining(["HabitFlow", "NoteNest"]))
  })
})
