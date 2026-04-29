## Goal

Three ADD-ONLY changes inside `src/routes/session.$id.tsx` only. No changes to canvas rendering, payment, QR, or admin logic.

1. Remove the print preview modal — clicking "ปริ้นท์รับเลย" prints immediately.
2. Replace `doPrint()` with the exact `printCanvas` HTML/CSS spec (100×148mm, no scaling, no settings).
3. Show the upsell modal 1s after print fires (not before), with a 30s timer bar and second-print option.
4. Show pulsing "กำลังพิมพ์อยู่นะ…" status on the delivery screen while the print window is open; switch to "✅ สั่งพิมพ์แล้ว!" after `afterprint` (or fallback timer).

## Changes — `src/routes/session.$id.tsx`

### A. Remove preview modal (lines 404–429)

Delete the entire `{printOpen && (...)}` block. Remove the `printOpen` state and `openPrint()` helper. The "ปริ้นท์รับเลย" button now calls `handlePrintClick()` directly.

### B. New `printCanvas(canvas)` helper

Replace existing `doPrint()` with the exact spec the user provided. Since the current code stores `photoOutputUrl` (a remote string, not a canvas), the helper accepts a canvas. To produce one from `photoOutputUrl`, add a tiny `urlToCanvas(url)` util that loads the image (with `crossOrigin = "anonymous"`) and draws it to an offscreen canvas at natural size. Then call `printCanvas(canvas)` with the user's exact HTML/CSS body (100mm × 148mm, `object-fit: fill`, `@page size: 100mm 148mm portrait`, auto `window.print()` after 600ms, auto `window.close()` 1500ms after print).

The opened print window reference is returned so we can attach `afterprint` to detect closure.

### C. New `handlePrintClick()` flow

Sequence on click of "🖨️ ปริ้นท์รับเลย":

1. Set `isPrinting = true` (drives delivery-screen status).
2. `urlToCanvas(photoOutputUrl)` → `printCanvas(canvas)` → keep returned `win`.
3. Listen for `win.addEventListener("afterprint", …)` → set `isPrinting = false` (printed state). Also a 12s safety timer to flip the same flag in case `afterprint` doesn't fire.
4. After 1000ms, open the upsell modal (`upsellOpen = true`, `upsellRemainingMs = 30000`).

### D. Upsell modal

New state: `upsellOpen`, `upsellRemainingMs` (number, drives progress bar), `secondPrintMessage` (string|null).

UI (rendered conditionally inside the delivery section):

- Fixed centered modal, accent border, rounded-3xl card.
- Badge: "🔥 ข้อเสนอพิเศษ"
- Headline: "พิมพ์แผ่นที่ 2 เพิ่มไหม?"
- Thin progress bar below headline: width = `(remainingMs / 30000) * 100%`, accent color, drains over 30s using a 100ms `setInterval` that decrements `remainingMs`. When it hits 0 → silently close, no second print.
- Strikethrough "ปกติ 69.-" then "เพียง 30.- เท่านั้น! 🎉"
- Button 1 "รับเลย! +30.- 🙌": call `printCanvas` again with a fresh canvas; show inline "กำลังพิมพ์แผ่นที่ 2... 🖨️"; close modal after 2000ms.
- Button 2 "ไม่ขอบคุณ": close immediately.
- Cleanup: clear interval on close/unmount.

### E. Delivery-screen printing status

Inside the existing print card (where the "ปริ้นท์รับเลย" button lives), below the button, render:

- While `isPrinting`: `🖨️ กำลังพิมพ์อยู่นะ รอแปปนึง...` with `animate-pulse text-primary`.
- After print finishes (`isPrinting === false` and `hasPrintedOnce === true`): `✅ สั่งพิมพ์แล้ว!` (static).

`hasPrintedOnce` is set true the first time `handlePrintClick` runs.

## Notes / out of scope

- No canvas/composer changes. We just load the already-generated image URL into a canvas to feed `printCanvas`.
- No payment/QR/admin changes.
- Page size strictly follows the user's spec (100mm × 148mm portrait).
- `cfg?.printOrientation` becomes unused for this flow; left untouched in the codebase.
- All Thai copy is verbatim from the user's spec.

## Files touched

- `src/routes/session.$id.tsx` — only file edited.
