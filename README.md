# StoreMate Playwright Test Suite (TypeScript)

โปรเจกต์ทดสอบอัตโนมัติแบบ End-to-End (E2E) สำหรับระบบ **StoreMate** (https://storemate-final.vercel.app/) พัฒนาด้วย **Playwright** และ **TypeScript** รองรับการทดสอบแบบ Page Object Model (POM) พร้อมระบบรายงานผลแบบ Interactive HTML Report

---

## ข้อมูลบัญชีและสภาพแวดล้อมที่ใช้ทดสอบ (Test Environment & Account)

- **URL เว็บไซต์**: https://storemate-final.vercel.app/
- **บัญชีทดสอบ**:
  - **Email**: `aomezzz.aomsin@gmail.com`
  - **Password**: `Aomezzz_007`
- **ระบบปฏิบัติการ / เครื่องมือ**: Node.js (v22+), Playwright (@playwright/test), TypeScript

---

## โครงสร้างโปรเจกต์ (Project Structure)

```
1-playwright-storemate/
├── pages/                             # Page Object Model (POM)
│   ├── LoginPage.ts                   # Page Object สำหรับหน้าเข้าสู่ระบบ & Dashboard
│   └── StockPage.ts                   # Page Object สำหรับหน้าจัดการสินค้าในคลัง
├── tests/                             # Test Suites (.spec.ts)
│   ├── login.spec.ts                  # ชุดทดสอบระบบเข้าสู่ระบบ (3 Test Cases)
│   ├── stocks.spec.ts                 # ชุดทดสอบระบบจัดการสินค้าในคลัง (10 Test Cases ตาม Spec)
│   └── fixtures/                      # ไฟล์ข้อมูลทดสอบ (Test Fixtures)
│       ├── product_spec.xlsx          # ไฟล์ xlsx สำหรับทดสอบแนบไฟล์
│       ├── large_file.xlsx            # ไฟล์จำลองขนาดเกิน 5 MB
│       └── executable.exe             # ไฟล์จำลองนามสกุลไม่รองรับ (.exe)
├── playwright-report/                 # รายงานผลการทดสอบ HTML แบบโต้ตอบได้
├── test-results/                      # ผลลัพธ์ภาพแคปหน้าจอและวิดีโอเมื่อเกิดข้อผิดพลาด
├── .env                               # ไฟล์คอนฟิกค่า Environment Variables
├── .env.example                       # ตัวอย่างไฟล์ Environment Variables
├── playwright.config.ts               # การตั้งค่า Playwright Test Runner
├── package.json                       # Scripts และรายการ Dependencies
└── tsconfig.json                      # การตั้งค่า TypeScript Compiler
```

---

## ชุดทดสอบที่มี (Test Cases)

### 1. [tests/stocks.spec.ts](tests/stocks.spec.ts) (โมดูล จัดการสินค้าในคลัง)
ครอบคลุมครบทั้ง 10 กรณีทดสอบตามเอกสาร **Test Case Specification (SPRS - Storemate Ecommerce)**:
- **TC-LOT-001**: เพิ่มสินค้าในคลังใหม่สำเร็จผ่าน Modal Popup (Positive Test)
  - ข้อมูลทดสอบ: ชื่อ `สบู่สมุนไพรไหมทอง`, หมวดหมู่ `สบู่`, ราคา `85`, จำนวน `100`, สถานะ `พร้อมจำหน่าย`, แนบไฟล์ `product_spec.xlsx`
- **TC-LOT-002**: เพิ่มสินค้าโดยไม่กรอกชื่อสินค้า (Negative Test)
- **TC-LOT-003**: ไม่เลือกหมวดหมู่สินค้า (Negative Test)
- **TC-LOT-004**: ราคาสินค้าไม่ถูกต้อง เช่น กรอกค่าติดลบ `-50` (Negative Test)
- **TC-LOT-005**: จำนวนสินค้าไม่ถูกต้อง เช่น กรอกค่าติดลบ `-10` (Negative Test)
- **TC-LOT-006**: อัปโหลดรูปภาพหรือไฟล์ไม่ถูกต้อง เช่น ไฟล์ขนาดเกิน 5 MB หรือนามสกุล `.exe` (Negative Test)
- **TC-LOT-007**: แก้ไขข้อมูลสินค้าสำเร็จ ปรับจำนวนเป็น `50` และสถานะเป็น `ไม่พร้อมจำหน่าย` (Positive Test)
- **TC-LOT-008**: ลบสินค้าที่ไม่มีประวัติใช้งาน (Positive Test)
- **TC-LOT-009**: ลบสินค้าที่มีประวัติใช้งาน (Negative / Business Rule Test)
- **TC-LOT-010**: ค้นหาสินค้าด้วยชื่อ คำค้นหา `สบู่` (พบข้อมูล) และ `ไม่มีสินค้านี้ในระบบ` (ไม่พบข้อมูล) (Positive & Negative Test)

### 2. [tests/login.spec.ts](tests/login.spec.ts) (โมดูล เข้าสู่ระบบ)
- **TC01 - Login With Valid Credentials Should Succeed**: เข้าสู่ระบบสำเร็จและ redirect ไปยังหน้า Dashboard
- **TC02 - Login With Invalid Password Should Fail**: กรอกรหัสผ่านผิดและไม่สามารถเข้าสู่ระบบได้
- **TC03 - Login With Empty Password Should Show Validation**: เว้นว่างรหัสผ่าน ระบบไม่อนุญาตให้เข้าหน้า Dashboard

---

## คำสั่งการรันเทส (Test Execution Commands)

### 1. รันการทดสอบทั้งหมด (All Tests)
```bash
# รันแบบ Headless (ค่าเริ่มต้น)
npm test

# หรือรันผ่าน npx
npx playwright test
```

### 2. รันแบบเปิดหน้าต่างเบราว์เซอร์ (Headed Mode)
```bash
npm run test:headed
```

### 3. รันผ่าน Playwright UI Mode (Interactive UI Runner)
```bash
npm run test:ui
```

### 4. รันเจาะจงเฉพาะไฟล์เทส
```bash
# รันเฉพาะชุด Login
npm run test:login

# รันเฉพาะชุด Stock Management
npm run test:stocks
```

### 5. รันเจาะจงเฉพาะ Tag
```bash
# รันเฉพาะกลุ่ม Smoke Tests
npx playwright test --grep "@smoke"

# รันเฉพาะกลุ่ม Positive Tests
npx playwright test --grep "@positive"

# รันเฉพาะกลุ่ม Negative Tests
npx playwright test --grep "@negative"
```

### 6. ตรวจสอบ Type ของ TypeScript
```bash
npm run typecheck
```

---

## การดูรายงานผลการทดสอบ (Reports & Evidence)

เปิดดูรายงานผล HTML แบบครบวงจร (แสดงขั้นตอน, วิดีโอ, ภาพแคปหน้าจอ, Call log และ Network):
```bash
npm run test:report
# หรือ
npx playwright show-report
```
