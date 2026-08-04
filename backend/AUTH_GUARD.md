# Auth0 JWT Guard Overview

เอกสารนี้อธิบายโค้ดในส่วน JWT authentication ของ backend ที่อยู่ในโฟลเดอร์ `src/auth` ว่าทำงานอย่างไร และมีขั้นตอนอะไรบ้างตั้งแต่รับ Bearer token จนถึงตรวจสอบกับ Auth0

## ไฟล์ที่เกี่ยวข้อง

- `src/auth/auth.module.ts`
- `src/auth/auth.guard.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.constants.ts`
- `src/auth/auth.types.ts`

## เป้าหมายของโค้ดชุดนี้

guard ชุดนี้มีหน้าที่รับ JWT จาก `Authorization: Bearer <token>` แล้วตรวจว่า token นั้น:

- มีลายเซ็นถูกต้องตาม JWKS ของ Auth0
- ออกโดย issuer ที่ได้จาก discovery document
- มี audience ตรงกับ `https://bbl-candidate-test-api`
- ใช้เป็น access token สำหรับ API นี้ ไม่ใช่ id token

เมื่อ token ผ่านการตรวจสอบ ข้อมูลผู้ใช้จาก payload จะถูกแนบไว้บน request เพื่อให้ controller หรือ service ชั้นถัดไปนำไปใช้ต่อได้

## ลำดับการทำงาน

1. Client เรียก API พร้อม header `Authorization: Bearer <token>`
2. `AuthGuard` รับ request และแยก Bearer token ออกจาก header
3. `AuthGuard` ส่ง token ไปให้ `AuthService.verifyAccessToken()`
4. `AuthService` จะ fetch discovery document จาก Auth0 ถ้ายังไม่เคยโหลดมาก่อน
5. `AuthService` อ่าน `jwks_uri` จาก discovery document แล้วสร้าง remote JWK set
6. `AuthService` ใช้ `jwtVerify(...)` เพื่อตรวจ signature, `iss`, และ `aud`
7. ถ้าผ่าน จะคืน payload กลับไปที่ guard
8. `AuthGuard` แนบข้อมูล auth ลงใน `request.auth`
9. ถ้าไม่ผ่านขั้นตอนไหน จะโยน `UnauthorizedException` และ NestJS จะตอบกลับ `401`

## อธิบายทีละไฟล์

### `auth.constants.ts`

ไฟล์นี้เก็บค่าคงที่หลักของระบบ auth:

- `AUTH0_DISCOVERY_URL`: URL ของ OpenID Connect discovery document
- `AUTH0_API_AUDIENCE`: audience ที่ API นี้ต้องยอมรับเท่านั้น

การแยกออกมาเป็น constants ทำให้เปลี่ยนค่าได้ง่ายและลดการ hardcode ซ้ำในหลายไฟล์

### `auth.service.ts`

ไฟล์นี้เป็นแกนหลักของการตรวจ token

#### 1. กำหนด type ของ discovery document

`Auth0DiscoveryDocument` ระบุว่าเราใช้ข้อมูลอะไรจาก discovery document บ้าง:

- `issuer`
- `jwks_uri`

#### 2. กำหนด type ของ payload ที่ผ่านการ verify แล้ว

`VerifiedAccessTokenPayload` ขยายจาก `JWTPayload` เพื่อบอกว่าโค้ดคาดหวัง field สำคัญอะไร:

- `iss`
- `sub`
- `aud`
- `scope` และ `permissions` ถ้ามี

#### 3. `verifyAccessToken(token)`

เมธอดนี้ทำงานหลัก 3 ขั้น:

- โหลด discovery document
- โหลด JWK set จาก `jwks_uri`
- เรียก `jwtVerify(...)`

ตัวเลือกที่ส่งเข้า `jwtVerify(...)` คือ:

- `issuer: discoveryDocument.issuer`
- `audience: AUTH0_API_AUDIENCE`

ผลคือ token จะผ่านได้ก็ต่อเมื่อ:

- signature ตรวจสอบได้ด้วย key จาก Auth0
- `iss` ตรงกับ issuer ของ tenant
- `aud` ตรงกับ API audience นี้

ถ้า verify ไม่ผ่าน จะ throw `UnauthorizedException('Invalid access token')`

#### 4. การ cache discovery และ JWKS

service ใช้ `discoveryDocumentPromise` และ `jwksPromise` เพื่อไม่ต้อง fetch ข้อมูลเดิมทุก request

ข้อดีคือ:

- ลด network call ซ้ำ
- ลด latency
- ยังเป็นไปตาม requirement ที่ให้ fetch discovery ก่อน ไม่ hardcode `jwks_uri`

#### 5. `fetchDiscoveryDocument()`

เมธอดนี้เรียก `fetch(AUTH0_DISCOVERY_URL)` แล้วตรวจว่า:

- response สำเร็จ
- body มี `issuer`
- body มี `jwks_uri`

ถ้าข้อมูลไม่ครบ จะถือว่าใช้ตรวจ token ต่อไม่ได้และตอบ `401`

### `auth.guard.ts`

guard นี้ทำหน้าที่เชื่อม request ของ NestJS เข้ากับ logic ใน service

#### 1. `canActivate(context)`

เมธอดนี้เป็น entry point ของ guard โดยจะ:

- ดึง request จาก `ExecutionContext`
- แยก Bearer token
- ส่ง token ไป verify
- แนบผลลัพธ์ลง `request.auth`

ถ้าทุกอย่างถูกต้อง จะ return `true`

#### 2. `extractBearerToken(request)`

เมธอดนี้ตรวจรูปแบบของ header:

- ถ้าไม่มี `Authorization` header -> `401`
- ถ้าไม่ใช่รูปแบบ `Bearer <token>` -> `401`

การแยก logic นี้ออกเป็นเมธอดย่อยช่วยให้ guard อ่านง่ายและแก้เงื่อนไขได้ง่ายขึ้นในอนาคต

### `auth.types.ts`

ไฟล์นี้เพิ่ม type `AuthenticatedRequest` ซึ่งขยายจาก Express `Request` และเพิ่ม field `auth`

เมื่อ guard verify ผ่านแล้ว request จะมีข้อมูลนี้:

- `token`: token เดิมจาก header
- `subject`: ค่า `sub` จาก token
- `payload`: payload เต็มที่ผ่านการ verify แล้ว

ทำให้ controller ในอนาคตเข้าถึงข้อมูลผู้ใช้แบบ type-safe ได้

### `auth.module.ts`

ไฟล์นี้ register และ export ส่วนประกอบ auth ให้ module อื่นใช้ได้:

- `AuthService`
- `AuthGuard`

ผลคือ controller ใดที่ต้องการใช้ guard สามารถใส่ `@UseGuards(AuthGuard)` ได้เมื่อพร้อม

## ทำไมโค้ดนี้ช่วยกัน id token ได้

ระบบนี้ไม่ได้พยายามอ่านชื่อ token ว่าเป็น `id_token` หรือ `access_token` ตรง ๆ แต่บังคับผ่านเงื่อนไขที่ถูกต้องกว่าคือ:

- token ต้อง verify signature ได้จาก Auth0
- token ต้องมี `iss` ตรงกับ tenant
- token ต้องมี `aud` เป็น `https://bbl-candidate-test-api`

id token โดยปกติจะถูกออกให้ client application ไม่ใช่ API audience นี้ ดังนั้นจะไม่ผ่านเงื่อนไข `aud` และถูกปฏิเสธเป็น `401`

## วิธีนำไปใช้ภายหลัง

เมื่อพร้อมผูกกับ endpoint สามารถใช้แบบนี้:

```ts
@UseGuards(AuthGuard)
@Get('me')
getMe(@Req() request: AuthenticatedRequest) {
  return request.auth;
}
```

หมายเหตุ: ตอนนี้ guard ถูกสร้างไว้พร้อมใช้แล้ว แต่ยังไม่ได้ apply กับ controller ใดตามเจตนาที่ต้องการให้ตรวจโค้ดก่อน

## ข้อควรระวังถัดไป

- ตอนเริ่มทำ endpoint จริง ต้องใช้ `request.auth.subject` หรือข้อมูลจาก payload ไป map กับ user ในฐานข้อมูล
- ทุก endpoint ที่แตะ `Collection` และ `Bookmark` ต้องกรองด้วย `ownerId` ของผู้ใช้ที่ authenticate แล้วเสมอ
- ควรเพิ่ม test สำหรับกรณีไม่มี token, token audience ผิด, และ token ของผู้ใช้อื่นเมื่อเริ่มผูก guard กับ endpoint จริง