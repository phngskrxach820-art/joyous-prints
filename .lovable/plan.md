## เป้าหมาย

สร้างไฟล์เดียว (Markdown) ที่รวม **prompt + โค้ดทั้งโปรเจกต์** สำหรับให้ AI อีกตัว (เช่น Cursor/Copilot/Claude ใน VSCode) สร้างโปรเจกต์นี้ขึ้นมาใหม่บนเครื่อง local ได้ครบ

ผลลัพธ์: ไฟล์ดาวน์โหลดได้ที่ `/mnt/documents/photobooth-bundle.md` พร้อม `<presentation-artifact>` ให้ user กดโหลด

## เนื้อหาในไฟล์

### ส่วนที่ 1 — Prompt หัวเรื่อง (ภาษาไทย)
- บอก AI ว่าให้สร้างโปรเจกต์ TanStack Start + React 19 + Vite 7 + Tailwind v4 + Supabase
- ขั้นตอน: `bun create`, ติดตั้ง deps, สร้างไฟล์ตาม path ที่ให้, รัน `bun dev`
- ตั้งค่า `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID) — ให้ user กรอกเอง
- รายการ DB schema: `sessions`, `print_queue` + storage bucket `photos` พร้อม SQL ให้รันใน Supabase

### ส่วนที่ 2 — package.json + config
- `package.json`, `tsconfig.json`, `vite.config.ts`, `wrangler.jsonc`, `components.json`, `bunfig.toml`, `eslint.config.js`, `.prettierrc`

### ส่วนที่ 3 — ไฟล์ source หลัก (ใส่เนื้อหาเต็ม)
- `src/router.tsx`, `src/styles.css`
- `src/routes/__root.tsx`, `index.tsx`, `admin.tsx`, `live.tsx`, `session.$id.tsx`, `download.$id.tsx`
- `src/components/CaptureFlow.tsx`, `FormatCard.tsx`, `FilterPicker.tsx`, `Instructions.tsx`, `InstallPrompt.tsx`, `ThemeProvider.tsx`
- `src/lib/composer.ts`, `frames.ts`, `filters.ts`, `audio.ts`, `promo.ts`, `print-queue.ts`, `lan-server.ts`, `admin-config.ts`, `utils.ts`
- `src/integrations/supabase/client.ts`, `types.ts`, `auth-middleware.ts`, `client.server.ts` (พร้อมหมายเหตุว่า auto-gen)

### ส่วนที่ 4 — public/ + server/
- `public/manifest.json`, `sw.js`, `gif.worker.js`, `robots.txt`
- หมายเหตุไฟล์รูป/เสียงที่ต้องเตรียมเอง: `public/frames/*.png` (โดยเฉพาะ `frame_full_cinnamoroll.png`), `qr-payment.png`
- `server/index.js`, `server/package.json`, `server/README.md` (LAN print server)

### ส่วนที่ 5 — Supabase setup SQL
- CREATE TABLE sessions, print_queue
- RLS policies ที่ใช้อยู่
- Storage bucket `photos` (public)

### ส่วนที่ 6 — checklist หลังสร้าง
- `bun install` → `bun dev`
- ตรวจ `frame_full_cinnamoroll.png` มีจริงใน `public/frames/`
- เปิด `/admin` เพื่อตั้งค่า

## วิธีทำ

1. รันสคริปต์ใน `code--exec` เพื่อ:
   - อ่านไฟล์ทั้งหมดในรายการข้างบน
   - ห่อแต่ละไฟล์ใน fenced code block พร้อม heading `### path/to/file`
   - prepend prompt-header (ภาษาไทย) + Supabase SQL
   - เขียนผลลัพธ์ลง `/mnt/documents/photobooth-bundle.md`
2. รายงานขนาดไฟล์ + presentation-artifact tag

## ของที่ไม่รวม

- ไฟล์ binary (.png, .mp3, .ico, qr-payment.png) — ใส่เป็น "เตรียมเอง" แทน เพราะลง markdown ไม่ได้
- `node_modules/`, `.lovable/`, `dist/`, `routeTree.gen.ts` (auto-gen)
- `src/components/ui/*` (shadcn) — ใส่คำสั่ง `bunx shadcn@latest add ...` แทน เพื่อลดขนาดไฟล์ (~50 ไฟล์)

## คำถามก่อนลงมือ

ก่อนสร้าง อยากเช็ค 2 จุด:

1. **shadcn ui components (~50 ไฟล์ใน `src/components/ui/`)** — รวมโค้ดเต็มลงไฟล์ หรือ ใส่แค่คำสั่ง `bunx shadcn add button card ...` ให้ AI ติดตั้งเอง?
2. **ไฟล์ binary (กรอบ PNG, เสียง, QR)** — ต้องการให้ encode เป็น base64 ฝังใน markdown ไหม (ไฟล์จะใหญ่ขึ้นมาก) หรือใส่เป็น placeholder ให้ user copy เองทีหลัง?
