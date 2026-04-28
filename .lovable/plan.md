## What exists today

There is no separate "Theme Picker" route in the project. The frame/format selection cards live inline inside `src/routes/session.$id.tsx` (the `step === "format"` block), driven by the `LAYOUTS` array exported from `src/lib/composer.ts`. Today that array shows three cards:

- A: "แบ่งให้เพื่อน" ✂️
- B: "เต็มแผ่น 4x6" ⭐ (recommended)
- C: "ฟิล์มสตริป" 🎞️

The canvas slot constants (`STRIP_SLOTS`, `FULL_SLOTS`), frame loading, GIF logic, payment flow, and capture logic are all untouched by this change.

## Change

ADD ONLY: trim the visible picker cards to exactly the two requested options, with the new labels and copy.

### `src/lib/composer.ts` — `LAYOUTS` export

Replace the 3-entry `LAYOUTS` array with exactly 2 entries (keep the underlying `renderLayoutA/B/C/D` functions and slot constants intact — nothing else is removed):

```ts
export const LAYOUTS = [
  {
    id: "A" as const,
    label: "แบ่งให้เพื่อน 💑 (2x6)",
    emoji: "💑",
    desc: "ถ่าย 3 รูป ได้ 2 แถบเหมือนกันบนกระดาษ 4x6 แบ่งกับเพื่อนได้เลย",
    needsCount: 3,
  },
  {
    id: "B" as const,
    label: "เต็มแผ่น 4x6 🖼️",
    emoji: "🖼️",
    desc: "ถ่าย 6 รูป จัดเป็นกริด 2x3 เต็มแผ่น 4x6",
    recommended: true,
    needsCount: 6,
  },
];
```

This removes the "ฟิล์มสตริป" / "ฟิล์มคลาสสิก" card and any other third option from the picker UI without touching the rendering functions or slot constants. `renderLayoutC` stays defined but unused by the picker.

### `src/routes/session.$id.tsx` — picker presentation only

The existing `LAYOUTS.map(...)` block already iterates whatever is in `LAYOUTS`, so no JSX changes are required for the card list itself. Two tiny touch-ups in the same block to match the spec:

- Default `useState<LayoutId>("B")` stays (recommended card).
- `FormatPreview` already handles ids "A", "B", "C". Leave as-is — only "A" and "B" will be rendered.

No changes to: capture flow, shot count handling, payment, QR delivery, print, admin, or any canvas/slot constants.

## Files touched

- `src/lib/composer.ts` — replace `LAYOUTS` export contents only (3 → 2 entries with new labels/desc).

## Notes

- "Keep canvas rendering code unchanged" honored — `renderLayoutA`, `renderLayoutB`, `renderLayoutC`, `renderLayoutD`, `STRIP_SLOTS`, and `FULL_SLOTS` are not edited.
- Capture currently always takes 4 shots; the `needsCount` field in `LAYOUTS` is informational and not yet wired into `CaptureFlow`. Per the user's "do not change capture logic" rule, this plan does not modify capture to take 3 or 6 shots — it only updates the picker cards. If they want shot count to actually follow the picker, that's a follow-up request.
