ผมเจอสาเหตุแล้ว: ตอนนี้ระบบมีตัวเลือกกรอบ/ธีม แต่โค้ดถ่ายจริงกับ render รูปสุดท้ายไม่ได้ใช้กรอบที่เลือกจริง ๆ

ปัญหาหลักที่พบ:
- `CaptureFlow` รับ `design` เข้ามา แต่ไม่ render `PhotoboothOverlay` เลย ทำให้หน้าถ่ายเห็นแค่กล้องเปล่ากับเส้นประเดิม เหมือนถูกล็อคทั้ง 2x6 และ 4x6
- `composer.ts` รับ `designId` แล้วแต่ทิ้งค่าไว้ (`_designId`) และโหลดไฟล์ default ตายตัวเสมอ:
  - 2x6 ใช้ `/frames/frame_strip_default.png`
  - 4x6 ใช้ `/frames/frame_full_default.png`
- `PhotoboothOverlay.tsx` ถูกเปลี่ยนให้ทุก design กลายเป็น crop guide เส้นประเหมือนกันหมด จึงไม่มีความต่างระหว่างกรอบที่เลือก
- ระบบกรอบที่เพิ่มใน `src/lib/frames.ts` ยังไม่ได้ถูกเชื่อมเข้ากับหน้าเลือกธีม/การ render จริง

แผนแก้แบบ FIX ONLY:

1. ทำให้หน้าถ่ายใช้กรอบที่เลือกจริง
- ใน `CaptureFlow.tsx` จะครอบ video ด้วย `PhotoboothOverlay` หรือ equivalent overlay ที่ใช้ `design` ปัจจุบัน
- กรอบ/ธีมที่เลือกจะปรากฏทันทีตอนถ่าย ไม่ใช่แค่เส้นประเหมือนเดิม
- คง crop guide/สัดส่วนเดิมไว้เท่าที่จำเป็น ไม่แตะ logic ถ่ายภาพ/payment/print

2. ทำให้ final canvas ใช้ `selectedDesignId` จริง
- ใน `composer.ts` จะเลิก ignore `designId`
- เปลี่ยน `loadFrame()` / `loadStripFrame()` ให้เลือกไฟล์จาก design ที่ส่งเข้ามา แทนการ hardcode default
- ถ้าเลือก strip design ให้โหลดกรอบ strip ของ design นั้น
- ถ้าเลือก full design ให้โหลดกรอบ full ของ design นั้น
- ถ้าไฟล์กรอบนั้นไม่มี จะ fallback เป็น default เฉพาะกรณีจำเป็น เพื่อไม่ให้ render พัง

3. ทำ mapping ระหว่าง design id กับไฟล์ PNG กรอบ
- เพิ่ม mapping เช่น:
  - `strip-korean-mono` -> `/frames/frame_strip_korean_mono.png`
  - `strip-y2k-cyber` -> `/frames/frame_strip_y2k_cyber.png`
  - `strip-siam-marigold` -> `/frames/frame_strip_siam_marigold.png`
  - `strip-bunny-cute` -> `/frames/frame_strip_bunny_cute.png`
  - `full-korean-cafe` -> `/frames/frame_full_korean_cafe.png`
  - `full-y2k-fairy` -> `/frames/frame_full_y2k_fairy.png`
  - `full-siam-sunset` -> `/frames/frame_full_siam_sunset.png`
  - `full-soft-pastel` -> `/frames/frame_full_soft_pastel.png`
- ถ้าโปรเจกต์ยังไม่มี PNG เหล่านี้ จะยัง fallback ไป default ได้ แต่โครงระบบจะไม่ล็อค default อีกต่อไป

4. แก้ preview หน้าเลือกกรอบให้ไม่หลอกตา
- ตอนนี้ `ThemePicker` ใช้ `PhotoboothOverlay` แต่ทุกกรอบแสดงเส้นประเหมือนกัน
- จะทำให้ preview card แสดง frame PNG ของ design นั้นจริง ถ้าไฟล์มี
- ถ้าไม่มีไฟล์จะแสดง fallback แบบชัดเจน ไม่ใช่ทำเหมือนเลือกแล้วแต่สุดท้ายเหมือนเดิม

5. ตรวจเส้นทาง state ให้กรอบไม่หายกลางทาง
- ยืนยันและแก้เฉพาะจุดที่จำเป็นให้ `designId` ผ่านครบ:

```text
theme picker -> capture -> filter -> payment -> render -> delivery/print
```

- ไม่เปลี่ยน payment amount, promo, Cloudinary/local server, หรือ print queue logic

ผลลัพธ์หลังแก้:
- เลือกกรอบไหน ตอนถ่ายต้องเห็นกรอบนั้น
- รูปที่ render/print ต้องใช้กรอบนั้น ไม่กลับไป default
- 2x6 และ 4x6 จะไม่เหมือนถูกล็อคกรอบเดิมอีก
- ถ้าไฟล์กรอบ custom ยังไม่ได้อยู่ใน `/public/frames` ระบบจะไม่พัง แต่จะ fallback พร้อมโครงที่พร้อมใช้ทันทีเมื่อมีไฟล์