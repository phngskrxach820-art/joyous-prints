## Goal

Two ADD-ONLY changes:
1. Move format selection BEFORE capture (currently after upload).
2. Add a new filter picker step BETWEEN capture and payment, applied via `ctx.filter` inside the existing canvas renderers.

No changes to canvas slots, payment, QR, print, or admin.

## Current vs target flow

Current step order in `src/routes/session.$id.tsx`:
```text
capture → uploading → format → payment → rendering → delivery
```

Target step order:
```text
format → capture → uploading → filter → payment → rendering → delivery
```

Note: there are no `theme` or `instructions` steps inside `session.$id.tsx` today — those live on `/` (Home → Instructions component). The session page starts at format selection. Home → Instructions → start() → navigate to `/session/$id` will land users on the new `format` step. This matches the requested overall order: Home → Theme(Instructions) → Format → Capture → Filter → Payment → Delivery.

## Changes

### 1. `src/routes/session.$id.tsx` — reorder + filter step

- Add `"filter"` to `Step` type. Reorder so initial step is `"format"` (not `"capture"`).
- Initial state: `useState<Step>("format")`.
- `chooseLayout(l)`: store layout, then `setStep("capture")` (instead of `"payment"`).
- `handleCaptured(blobs)`: after upload success, `setStep("filter")` (instead of `"format"`).
- New `filter` state: `const [filter, setFilter] = useState<FilterId>("none")`. Persist to `sessions.filter` column if it exists; otherwise just keep client-side (we'll check schema — see Open Questions).
- New `filter` step UI:
  - Header: "เลือกโทนสีที่ชอบ 🎨"
  - Subtext: "ฟิลเตอร์จะถูกใส่ในทุกรูปเลย"
  - Horizontal scroll row (`overflow-x-auto flex gap-3`) of 6 cards (80×100px). Each card shows a small preview thumb of `photoUrls[0]` with the CSS `filter` applied, name + emoji below, accent border + check when selected.
  - Live preview grid below: all `photoUrls` thumbnails with the CSS filter applied via `style={{ filter: FILTERS[filter].css }}`.
  - Button "ใช้ฟิลเตอร์นี้เลย →" → `setStep("payment")`.
- `confirmPayment` already kicks off `backgroundRender(layout, photoUrls)` — extend to pass the filter: `backgroundRender(layout, photoUrls, FILTERS[filter].css)`.
- Back buttons (with `confirm()` dialogs in Thai):
  - Format → no back (already top of flow; keep existing "หน้าแรก" Link).
  - Capture → back to Format with confirm "เริ่มถ่ายใหม่เลยนะ?"  (we'll add a small back button in the capture header area — since CaptureFlow doesn't currently expose this, add it as an absolutely-positioned button in `session.$id.tsx` overlaying when `step === "capture"`).
  - Filter → back to Capture with confirm "ถ่ายใหม่เลยนะ?" — clears `photoUrls` and `setStep("format")` (must re-pick or we restart capture; simplest: setStep("capture") after clearing photoUrls, since totalShots comes from already-chosen layout).

### 2. New filter constants (top of `session.$id.tsx`)

```ts
type FilterId = "none" | "film" | "soft" | "cool" | "bw" | "vintage";
const FILTERS: Record<FilterId, { label: string; css: string }> = {
  none:    { label: "ปกติ",      css: "none" },
  film:    { label: "ฟิล์ม 🎞️",  css: "sepia(30%) contrast(95%) brightness(105%) saturate(85%)" },
  soft:    { label: "นุ่มๆ 🌸",  css: "brightness(110%) saturate(80%) contrast(90%) hue-rotate(5deg)" },
  cool:    { label: "เย็นๆ 🩵",  css: "saturate(70%) brightness(100%) hue-rotate(190deg) contrast(95%)" },
  bw:      { label: "ขาวดำ 🖤",  css: "grayscale(100%) contrast(105%)" },
  vintage: { label: "วินเทจ 🟤", css: "sepia(50%) brightness(95%) contrast(90%) saturate(75%)" },
};
```

### 3. `src/lib/composer.ts` — accept filter param

- Extend signatures to accept optional filter string (default `"none"`):
  - `renderLayoutA(photos, filter = "none")`
  - `renderLayoutB(photos, filter = "none")`
  - `renderLayoutD(photos, filter = "none")` (GIF)
  - `renderLayout(layout, photos, filter = "none")` — pass through.
- Inside each renderer, BEFORE drawing each photo via `drawCover(...)`, set `ctx.filter = filter` and after drawing reset to `ctx.filter = "none"`. Implement as a tiny wrapper:
  ```ts
  function drawCoverFiltered(ctx, img, x, y, w, h, filter) {
    const prev = ctx.filter;
    ctx.filter = filter || "none";
    drawCover(ctx, img, x, y, w, h);
    ctx.filter = prev;
  }
  ```
- Replace existing `drawCover(ctx, imgs[i], ...)` photo calls with `drawCoverFiltered(...)`. Frame overlay, watermark, headers, cut line — UNCHANGED, drawn without filter.
- For `renderLayoutD` (GIF): apply filter on the per-frame canvas via `cx.filter = filter` before `drawCover`, reset before watermark.

### 4. CaptureFlow back affordance

Minimal: add an optional `onBack?: () => void` prop to `CaptureFlow.tsx` and render a small "← ถ่ายใหม่" button in the top-left when in `preview` phase. Wire from `session.$id.tsx` to confirm + reset to format step.

## Files touched

- `src/routes/session.$id.tsx` — reorder steps, add filter step UI + state, add back-with-confirm wiring, pass filter into `backgroundRender`.
- `src/lib/composer.ts` — add filter param to A/B/D + `renderLayout`, apply via `ctx.filter` around photo draws only.
- `src/components/CaptureFlow.tsx` — add optional `onBack` prop and back button (preview phase only).

## Out of scope (explicitly NOT changing)

- Canvas slot dimensions, frame overlay logic, watermark.
- LAYOUTS array, `needsCount` (already 3 / 6).
- Payment confirmation, QR generation, print modal, admin, live view.
- Home page (`/`) and `Instructions` component — already serve as "theme/instructions" stage before session.

## Open question

The filter selection is currently kept client-side only. If you want it persisted to the `sessions` row (for live view / admin visibility), I'll add a `filter` text column via migration. Otherwise it stays in component state and is just baked into the rendered output. Default: client-side only unless you say otherwise.
