
# แผนแก้ไข: สัดส่วนพิมพ์จริง 100×148mm + เคลียร์ overlay ตอนถ่าย

## 1. ลบไฟล์และอ้างอิง `frame_strip_default.png`

- ลบไฟล์ `public/frames/frame_strip_default.png`
- `src/lib/design-frames.ts` → `frameFallbackForDesign()` คืน `null` สำหรับ design strip (ไม่มี fallback) แต่ full ยังคืน `/frames/frame_full_default.png`
- `src/lib/composer.ts` → `loadFrameForDesign("A", …)` ถ้า design ที่เลือกไม่มี PNG ของตัวเอง → ไม่วาด frame เลย (ปริ้นรูปเปล่าๆ บนพื้นหลัง white)
- `src/lib/frames.ts` → ลบ entry `strip-default` ออกจาก `DEFAULTS`
- `src/routes/__root.tsx` → เอาบรรทัด prefetch `/frames/frame_strip_default.png` ออก
- `src/components/CaptureFlow.tsx` และ `ThemePicker.tsx` → ใช้ผลลัพธ์ใหม่ของ `frameUrlForDesign` ที่อาจคืน `null` ได้

## 2. กำหนดสัดส่วนกลาง = 100×148mm portrait (≈ 0.6757)

สร้างค่ากลางใน `src/lib/composer.ts`:

```text
PRINT_W_MM = 100
PRINT_H_MM = 148
PRINT_ASPECT = 100/148   // ใช้ทั่วทั้งแอป
CANVAS_W = 1240          // px
CANVAS_H = 1835          // px (1240 / (100/148))
```

- เปลี่ยน Layout B (`renderLayoutB`) จาก landscape `1844×1240` → portrait `1240×1835`, จัด 4 ช่องเป็น 2×2 grid (เหมือน design 4-slot ที่วางไว้แล้ว)
- Layout A คง `1240×1835` portrait (strip ซ้าย+ขวา 3 รูป) — ปรับตัวเลข slot เล็กน้อยให้ตรง 1835
- `printCanvas()` ใน `session.$id.tsx` ตั้ง `@page size: 100mm 148mm portrait` อยู่แล้ว — คงไว้

## 3. FormatPreview ใหม่ (หน้าจ่ายเงิน)

แก้ `FormatPreview` ใน `src/routes/session.$id.tsx` ให้:

- กล่องนอกใช้ `aspect-ratio: 100/148` (portrait) ทั้ง A และ B — ตรงกับกระดาษจริง
- **Layout A (2×6 strip):** กรอบขาว portrait → แบ่ง 2 คอลัมน์ซ้าย/ขวา → แต่ละคอลัมน์ 3 ช่องรูปวางเรียงลง + เส้นประตัดกลาง
- **Layout B (4×6 full):** กรอบขาว portrait → grid 2×2 ช่องรูป
- รูป thumbnail ใช้ `object-fit: cover` เหมือนเดิม

ผลลัพธ์: ลูกค้าเห็น preview ที่อัตราส่วนเดียวกันกับใบที่ออกจากปริ้นเตอร์เป๊ะ

## 4. Capture overlay = crop guide เท่านั้น

แก้ `src/components/CaptureFlow.tsx`:

- ลบ state `frameUrl`, `useEffect` ที่โหลด frame, และ `<img>` overlay frame บน video
- ลบ import `frameUrlForDesign`, `frameExists`
- เก็บแค่กล่อง `border-2 border-dashed border-white/70` (crop guide เดิม) — ไม่มีลายตกแต่งใดๆ
- กรอบจริงจะถูกวางตอน final render เท่านั้น (ผ่าน `composer.ts` → PNG ที่จะอัปโหลดทีหลัง)

`ThemePicker` `FramePreview` คงไว้ (ใช้แสดงตัวอย่างกรอบบน theme card) — ถ้า PNG ไม่มี ก็ไม่แสดง

## 5. ไฟล์ที่จะแก้

- ลบ: `public/frames/frame_strip_default.png`
- แก้: `src/lib/design-frames.ts`, `src/lib/composer.ts`, `src/lib/frames.ts`
- แก้: `src/routes/__root.tsx` (เอา prefetch ออก)
- แก้: `src/routes/session.$id.tsx` (FormatPreview ใหม่)
- แก้: `src/components/CaptureFlow.tsx` (เอา overlay frame ออก)

## ของที่ไม่แตะ

- ราคา / โปรโมชัน / promo logic
- LAN server / print queue
- Cloudinary / Supabase upload flow
- FilterPicker
- ThemePicker (นอกจากปรับให้รับ `null` จาก fallback)
