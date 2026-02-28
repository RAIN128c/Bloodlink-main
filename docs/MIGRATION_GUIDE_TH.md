# คู่มือการตั้งค่าระบบ Bloodlink (Setup Guide)

คู่มือนี้สำหรับการตั้งค่าเริ่มต้นระบบ Bloodlink บนสภาพแวดล้อมใหม่

---

## ขั้นตอนที่ 1: ตั้งค่า Supabase
1.  สร้างโปรเจค Supabase ใหม่ที่ [supabase.com/dashboard](https://supabase.com/dashboard)
2.  ไปที่เมนู **SQL Editor** → รัน SQL Schema ที่อยู่ใน `docs/` เพื่อสร้างตาราง
3.  คัดลอก API Keys:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY` (ระวัง! ห้ามเปิดเผย)

## ขั้นตอนที่ 2: ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ภายใน `bloodlink-next/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhxx...
SUPABASE_SERVICE_ROLE_KEY=eyJhxx...
NEXTAUTH_SECRET=<random_string>
NEXTAUTH_URL=http://localhost:3000
```

## ขั้นตอนที่ 3: รันระบบ
```bash
cd bloodlink-next
npm install
npm run dev
```

## ขั้นตอนที่ 4: (Vercel) การ Deploy
1.  เชื่อมต่อ GitHub Repository กับ Vercel
2.  เพิ่ม Environment Variables ทั้งหมดจากข้อ 2 ใน Vercel Project Settings
3.  ตั้ง Root Directory เป็น `bloodlink-next`
4.  กด Deploy

---

**เสร็จสิ้นกระบวนการ** — ระบบพร้อมใช้งานทั้ง Development และ Production
