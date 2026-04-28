## Changes

### 1. Add a button click sound (`src/lib/audio.ts`)
Add a new `click()` function — short, soft beep (e.g. ~600Hz, 0.05s, gain 0.12) that feels like a tactile UI tap.

```ts
export const click = () => beep(600, 0.05, 0.12);
```

### 2. Wire click sound into the two buttons
- **`src/routes/index.tsx`** — "เริ่มเลย!" button: import `click` from `@/lib/audio`, call it inside the `onClick` handler before `setView("instructions")`.
- **`src/components/Instructions.tsx`** — "โอเค พร้อมถ่ายแล้ว!" button: import `click`, call it inside `onClick` before `onContinue()`.

### 3. Flip captured image data horizontally (`src/components/CaptureFlow.tsx`)
The video preview is mirrored via CSS (`transform: scaleX(-1)`) so it looks selfie-natural, but the captured canvas currently saves the un-mirrored frame, causing the saved photo to look reversed compared to what the user just saw.

Update the `capture()` function to apply a horizontal flip when drawing the video to the canvas, so the saved JPEG matches the on-screen preview:

```ts
const ctx = c.getContext("2d")!;
ctx.translate(w, 0);
ctx.scale(-1, 1);
ctx.drawImage(video, 0, 0, w, h);
```

This affects every captured photo immediately — review thumbnails, final composites (Layout A/B), and the GIF will all use the mirrored (selfie-correct) version.

## Files touched
- `src/lib/audio.ts` — add `click` export
- `src/routes/index.tsx` — play click on "เริ่มเลย!"
- `src/components/Instructions.tsx` — play click on "โอเค พร้อมถ่ายแล้ว!"
- `src/components/CaptureFlow.tsx` — flip canvas before drawImage in `capture()`
