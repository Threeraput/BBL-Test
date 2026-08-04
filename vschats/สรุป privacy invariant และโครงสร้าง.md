# สรุป privacy invariant และโครงสร้าง

- **Session ID:** 282ba31b-da00-413a-8df2-044084cc2595
- **Exported:** 2026-08-04T12:09:17.375Z
- **Model:** Auto
- **Messages:** 3

---

### User

อ่าน SPEC.md, AGENTS.md (หรือ .github/copilot-instructions.md),
และ DECISIONS.md ก่อน แล้วสรุปสั้นๆ 2-3 บรรทัดว่า:
1. privacy invariant ของโปรเจกต์นี้คืออะไร
2. ทำไมต้องใช้ 404 แทน 403
แล้วเช็คโครงสร้างที่ฉันทำไว้สามารถดำเนินงานตาม spec ต่อได้เลยไหม

### GitHub Copilot

จะเริ่มจากอ่านไฟล์ `SPEC.md`, `DECISIONS.md` และไฟล์คำสั่งเอเจนต์ ./github/copilot-instructions.md เพื่อสรุป privacy invariant/เหตุผล 404 vs 403 และประเมินว่าโครงสร้างปัจจุบันเดินงานต่อได้ตามสเปกเลยไหมครับ

จะดึงเนื้อหาหลักจากทั้งสามไฟล์พร้อมกัน แล้วเช็คว่ามี AGENTS.md หรือใช้ ./github/copilot-instructions.md เป็นแหล่งอ้างอิงหลักในรีโปนี้ครับ

อ่านครบตามที่ขอแล้ว และกำลังเช็คเพิ่มว่าในรีโปมี AGENTS.md อยู่จริงหรือไม่ เพื่อยืนยันแหล่งข้อกำหนดที่ใช้ครับ

ถัดไปจะประเมินความพร้อมของโครงสร้างโปรเจกต์เทียบสเปก โดยดูโมดูล backend/frontend และ schema ว่าพร้อมต่อยอด endpoint ตาม requirement แล้วหรือยังครับ

สรุปสั้นตามที่ขอ (อ้างอิงจาก `SPEC.md` และ `.github/copilot-instructions.md`, โดย `DECISIONS.md` ตอนนี้ยังว่าง):
1. Privacy invariant: ข้อมูลทุกชิ้น (Collection/Bookmark) ต้องเป็นของ owner คนเดียว และผู้ใช้อื่นห้ามเห็น/แก้ไข/ลบ/แม้แต่รับรู้ว่ามีข้อมูลนั้นอยู่
2. ต้องใช้ 404 แทน 403 เพราะ 403 เป็นการยืนยันกลายๆ ว่าทรัพยากรมีอยู่จริง ซึ่งทำให้เกิด information leak ขัดกับโมเดลความเป็นส่วนตัวของระบบนี้

เช็คโครงสร้างปัจจุบัน: ยัง “เดินงานต่อได้” แต่ยังไม่พร้อมปิดตามสเปกทันที เพราะยังขาดส่วนสำคัญ เช่น frontend ยังว่าง (`frontend`), Prisma schema ยังไม่มี model และ datasource url (`backend/prisma/schema.prisma`), และ backend ยังมีแค่โครง Auth เบื้องต้น ไม่มีโมดูล collections/bookmarks/users ตามข้อกำหนด (`backend/src/app.module.ts`, `backend/src/auth/auth.controller.ts`).

---

### User

```
เพิ่ม model User, Collection, Bookmark ใน
backend/prisma/schema.prisma ตามนี้:

model User {
  id        String   @id
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  collections Collection[]
  bookmarks   Bookmark[]
}

model Collection {
  id        String   @id @default(uuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  owner     User       @relation(fields: [ownerId], references: [id])
  bookmarks Bookmark[]
  @@index([ownerId])
}

model Bookmark {
  id           String   @id @default(uuid())
  url          String
  title        String
  notes        String?
  collectionId String?
  ownerId      String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  owner      User        @relation(fields: [ownerId], references: [id])
  collection Collection? @relation(fields: [collectionId], references: [id], onDelete: SetNull)
  @@index([ownerId])
  @@index([ownerId, collectionId])
}

ยังไม่ต้อง generate migration ให้ผมตรวจ schema ก่อน
```

### GitHub Copilot

กำลังเพิ่มทั้ง 3 models ลงใน `backend/prisma/schema.prisma` ตามสเปกที่ให้แบบตรงตัว และจะยังไม่รัน migration ตามที่กำชับครับ

เพิ่มเรียบร้อยแล้วใน `backend/prisma/schema.prisma` ตามโครงที่ส่งมา และยังไม่ได้ generate migration ตามที่ขอ

สิ่งที่เพิ่ม:
- `model User`
- `model Collection`
- `model Bookmark`
- relation และ index ตามที่ระบุครบ (`@@index([ownerId])`, `@@index([ownerId, collectionId])`, และ `onDelete: SetNull`)

---

### User

อ่าน SPEC.md และ AGENTS.md (หรือ .github/copilot-instructions.md) ก่อน
แล้วสรุปสั้นๆ ว่า Bearer token ที่ API นี้ต้องรับคือแบบไหน และ
audience ที่ต้องตรวจคืออะไร

จากนั้น สร้าง JWT auth guard ใน /backend สำหรับ validate token
จาก Auth0:

- Discovery endpoint: https://dev-yg.us.auth0.com/.well-known/openid-configuration
- ดึง JWKS จาก endpoint ที่ประกาศใน discovery document (อย่า hardcode
  JWKS URL ตรงๆ ให้ fetch discovery ก่อนแล้วอ่าน jwks_uri จากนั้น)
- ตรวจ signature, iss, aud (ต้องตรง https://bbl-candidate-test-api)
- ปฏิเสธ id_token ไม่ให้ใช้เป็น Bearer credential — รับเฉพาะ access token
  ที่ออกมาสำหรับ audience นี้เท่านั้น
- ทำเป็น NestJS Guard (@UseGuards) ที่ใช้ได้กับทุก controller

ยังไม่ต้อง apply guard กับ endpoint ไหนตอนนี้ แค่สร้าง guard เปล่าๆ
ให้ผมตรวจก่อน

### GitHub Copilot

จะอ่านข้อกำหนด auth จาก `SPEC.md` และสำรวจโค้ด auth/backend ที่มีอยู่ก่อน เพื่อยึดจุดแก้ที่เล็กที่สุดแล้วค่อยเพิ่ม guard ให้ตรงสเปกครับ

โครงสร้าง auth ตอนนี้ยังบางมากพอให้เพิ่มแบบตรงจุดได้: จะใส่ service สำหรับ fetch discovery/JWKS และ guard ที่เรียก service นี้ จากนั้นค่อยรัน build แบบแคบเพื่อตรวจว่า type/dep ครบครับ

จะโหลดเครื่องมือสำหรับติดตั้ง dependency และเช็ค error/build เพื่อให้หลังแก้ไฟล์แล้วตรวจได้ทันทีครับ

แผนสั้น ๆ:
1. เพิ่ม `reference` ที่ fetch discovery document แบบ runtime แล้ว memoize `jwks_uri`/`issuer`
2. เพิ่ม `AuthGuard` ที่ดึง Bearer token, verify signature + `iss` + `aud`, และผูกผลลัพธ์ไว้บน request
3. เพิ่ม dependency สำหรับ JWT/JWKS verification แล้วรัน compile check ของ backend เพื่อยืนยันว่า guard เปล่า ๆ นี้พร้อมให้ค่อยนำไปใช้กับ controller ได้ครับ

กำลังลงมือแก้ไฟล์ auth โดยให้ guard ใช้งานได้ทุก controller ผ่าน `@UseGuards(...)` แต่ยังไม่ผูกกับ endpoint ใดตามที่ขอครับ

แก้ไฟล์หลักเสร็จแล้ว ขั้นต่อไปคือทำให้ dependency ตรงกับโค้ดและรัน compile check ของ backend เพื่อจับ type/config ผิดทันทีครับ

dependency ลงแล้ว ต่อด้วย compile ของแพ็กเกจ backend เพื่อตรวจว่า guard/service ใหม่ผ่าน TypeScript ก่อนส่งให้ตรวจครับ

Bearer token ที่ API นี้ต้องรับคือ access token ที่ออกมาสำหรับ API audience นี้เท่านั้น ไม่ใช่ id_token; การกัน id_token ในทางปฏิบัติทำผ่านการ verify ว่า `reference` ต้องตรงกับ `https://bbl-candidate-test-api` และ signature/issuer ต้องถูกต้องตาม Auth0 discovery

---
