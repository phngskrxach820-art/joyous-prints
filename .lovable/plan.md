## เป้าหมาย

แก้ให้กล้องตอนถ่ายโหมด Cinnamoroll ใช้สัดส่วน 521/465 (≈1.12 แนวนอน) ตรงกับช่องในกรอบ เพื่อให้รูปที่จับได้ลงพอดีทุกช่อง ไม่โดน crop เสียท่า — โดยไม่แตะ payment / strip / admin

## ไฟล์ที่จะแก้

- `src/components/CaptureFlow.tsx` — รับ prop `layout` และจัด aspect ratio + crop ตาม slot
- `src/routes/session.$id.tsx` — ส่ง `layout` ลงไปให้ `CaptureFlow` (เลิกใช้ `aspectRatio` ที่คำนวณภายนอก)
- `src/lib/composer.ts` — ยืนยัน SLOTS ของ cinnamoroll (ค่าปัจจุบันถูกอยู่แล้ว → no-op verify)

## รายละเอียดการแก้

### 1) `CaptureFlow.tsx`

- เปลี่ยน prop จาก `aspectRatio?: number` เป็น `layout: LayoutId` (import จาก `@/lib/composer`)
- เพิ่มตารางกลางในไฟล์:
  ```
  const SLOT_RATIOS: Record<string, number> = {
    A: 413 / 230,
    B: 560 / 840,
    cinnamoroll: 521 / 465,
  }
  const slotRatio = SLOT_RATIOS[layout] ?? 3 / 4
  ```
- ใช้ `slotRatio` เป็นทั้ง:
  - `aspectRatio` ของกล่อง video (style แบบในสเปก: `width:100%`, `maxHeight:70vh`, `aspectRatio: slotRatio`, mirror selfie)
  - cropping ตอน capture (แทน logic เดิมที่คำนวณ `cropW = vh * aspectRatio`)
- เขียน `capture()` ใหม่ตามสเปก `captureFrame`:
  - คำนวณ `sx/sy/sw/sh` จาก `vidRatio` vs `slotRatio` (crop ซ้าย-ขวา หรือ บน-ล่าง)
  - canvas ขนาด `sw × sh` เต็ม native res, mirror ด้วย `translate(sw,0); scale(-1,1)`
  - แปลงเป็น Blob ผ่าน `toBlob('image/jpeg', 0.97)` (ใช้ Blob ต่อ flow เดิมที่ส่ง `Blob[]` ขึ้น `onComplete`; เก็บ quality 0.97 ตามสเปก)
- `containerStyle`: เลิกแยก portrait/landscape — ใช้ `width:100%, maxHeight:70vh, aspectRatio: slotRatio` ตัวเดียว ใช้ได้กับทุก layout
- Progress text เดิมแสดง `รูปที่ X/totalShots` อยู่แล้ว → cinnamoroll จะกลายเป็น "รูปที่ X/6" อัตโนมัติเมื่อ parent ส่ง `totalShots=6` (มีอยู่แล้ว)

### 2) `session.$id.tsx`

- จุดที่ render `CaptureFlow`: เปลี่ยน
  ```
  aspectRatio={layout === "A" ? 9/16 : layout === "cinnamoroll" ? 521/465 : 3/4}
  ```
  → ส่งเป็น `layout={layout}` แทน
- `totalShots` ตามแต่ละ layout คงเดิม (cinnamoroll = 6)
- ไม่แตะ payment / promo / print / admin / FormatSelect (cinnamoroll card มีอยู่แล้วและ select ได้)

### 3) `composer.ts`

- ตรวจ `SLOTS` ใน `renderLayoutCinnamoroll` ตรงกับสเปก:
  ```
  [{52,85,521,465}, {628,85,521,465},
   {52,605,521,465}, {628,605,521,465},
   {52,1120,521,470}, {628,1120,521,470}]  r=40, canvas 1200×1800
  ```
  ปัจจุบันตรงอยู่แล้ว — ไม่ต้องแก้
- โค้ด `drawImage` ใช้ cover-fit (`Math.max` ratio) อยู่แล้ว — เมื่อ input photo มี ratio 521/465 ก็จะลงเป๊ะไม่ crop เพิ่ม

## ของที่ไม่แตะ

- Payment / promo / Supabase update
- Strip layout (A) rendering, slot positions
- Admin, print queue, LAN server, Cloudinary upload
- FilterPicker, ThemePicker
- Layout B, C, D rendering

## ผลที่คาดหวัง

- เลือก "ชินนาม่อน 🐰" → กล้อง preview เป็นกรอบแนวนอน 1.12:1 ตรงกับช่องในกรอบ
- ถ่าย 6 รูปต่อเนื่อง progress "รูปที่ N/6"
- รูปที่ออกมาบนกรอบ Cinnamoroll เต็มทุกช่องไม่โดน crop เพี้ยน