# StoreMate Playwright Test Suite (TypeScript)

โปรเจกต์ทดสอบอัตโนมัติแบบ End-to-End (E2E) สำหรับระบบ **StoreMate** (https://storemate-final.vercel.app/) พัฒนาด้วย **Playwright** และ **TypeScript** รองรับการทดสอบแบบ Page Object Model (POM) และ Playwright Codegen Style พร้อมระบบรายงานผลแบบ Interactive HTML Report

---

## 1. ข้อมูลระบบและบัญชีทดสอบ (Test Environment & Credentials)

- **URL เว็บไซต์**: `https://storemate-final.vercel.app/`
- **บัญชีทดสอบ (Admin / Moderator)**:
  - **Email**: `aomezzz.aomsin@gmail.com`
  - **Password**: `Aomezzz_007`
- **ความต้องการของระบบ (Prerequisites)**:
  - Node.js version 18 ขึ้นไป (แนะนำ v20 หรือ v22)
  - npm version 9 ขึ้นไป

---

## 2. ขั้นตอนการติดตั้ง (Installation)

รันคำสั่งต่อไปนี้ตามลำดับในโฟลเดอร์โปรเจกต์:

### ขั้นตอนที่ 1: ติดตั้ง Dependencies ของโปรเจกต์
```bash
npm install
```

### ขั้นตอนที่ 2: ติดตั้งเบราว์เซอร์สำหรับ Playwright
```bash
# ติดตั้งเบราว์เซอร์ทั้งหมดที่จำเป็น (Chromium, Firefox, WebKit)
npx playwright install

# หรือติดตั้งเฉพาะ Chromium
npx playwright install chromium
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:
```powershell
# บน Windows PowerShell
Copy-Item .env.example .env

# หรือบน Command Prompt / Bash
cp .env.example .env
```
*(ค่าเริ่มต้นใน `.env` ได้ตั้งค่า `BASE_URL`, `VALID_EMAIL` และ `VALID_PASSWORD` ไว้พร้อมใช้งานแล้ว)*

---

## 3. โครงสร้างโปรเจกต์ (Project Structure)

```
1-playwright-storemate/
├── pages/                             # Page Object Models (POM)
│   ├── LoginPage.ts                   # Page Object สำหรับหน้าเข้าสู่ระบบ & Dashboard
│   └── StockPage.ts                   # Page Object สำหรับหน้าจัดการสินค้าในคลัง
├── tests/                             # ชุดการทดสอบอัตโนมัติ (.spec.ts)
│   ├── stock.spec.ts                  # ชุดทดสอบ Codegen ตามเอกสาร Google Docs (TC-LOT-001 ถึง TC-LOT-010)
│   ├── inventory-management.spec.ts   # ชุดทดสอบ UI Automation ครบวงจร (TC-INV-001 ถึง TC-INV-013)
│   ├── login.spec.ts                  # ชุดทดสอบระบบเข้าสู่ระบบ (TC01 - TC03)
│   └── fixtures/                      # ไฟล์ข้อมูลและรูปภาพสำหรับทดสอบ
│       ├── sample_product.png         # ไฟล์รูปภาพ PNG ตัวอย่าง
│       ├── large_image.png            # ไฟล์จำลองขนาดเกิน 5 MB (5.5 MB)
│       └── executable.exe             # ไฟล์จำลองนามสกุลไม่รองรับ (.exe)
├── sabu.jpg                           # ไฟล์รูปภาพสินค้าทดสอบ "สบู่มะม่วง"
├── playwright-report/                 # รายงานผลการทดสอบ HTML
├── test-results/                      # บันทึกภาพ Screenshots และ Videos เมื่อเกิด Failure
├── .env                               # ไฟล์คอนฟิก Environment Variables
├── playwright.config.ts               # การตั้งค่า Playwright Test Runner
└── package.json                       # Scripts และรายการ Dependencies
```

---

## 4. คำสั่งสำหรับรันการทดสอบ (Test Execution Commands)

### 4.1 รันตามชุดทดสอบหลัก (Recommended Scripts)

```bash
# 1. รันเฉพาะไฟล์ stock.spec.ts (TC-LOT-001 ถึง TC-LOT-010)
npm run test:stock

# 1.1 รันเฉพาะไฟล์ stock.spec.ts แบบเปิดหน้าต่างเบราว์เซอร์จริง (Headed)
npm run test:stock:headed

# 1.2 รันเฉพาะไฟล์ stock.spec.ts พร้อมบันทึกวิดีโอ (ช้า step ละ 1 วินาที)
npm run test:stock:video

# 1.3 รันเฉพาะไฟล์ stock.spec.ts แบบเปิดหน้าต่างเบราว์เซอร์จริง + บันทึกวิดีโอ
npm run test:stock:video:headed

# 2. รันชุด Inventory Management UI Full Suite (TC-INV-001 ถึง TC-INV-013)
npm run test:inv

# 3. รันชุดทดสอบการเข้าสู่ระบบ (Login Suite)
npm run test:login

# 4. รันการทดสอบทั้งหมดทุกไฟล์ในโปรเจกต์
npm test
```

---

### 4.2 รันในโหมดต่าง ๆ (Execution Modes)

```bash
# รันแบบเปิดหน้าต่างเบราว์เซอร์จริงให้เห็นการทำงาน (Headed Mode)
npm run test:headed
# หรือ
npx playwright test tests/stock.spec.ts --headed

# รันแบบบันทึกวิดีโอ (ชะลอทีละ 1 วินาทีต่อ step อัตโนมัติ เพื่อให้ดูวิดีโอรู้เรื่อง)
npm run test:video
# หรือรันแบบเปิดหน้าต่างเบราว์เซอร์พร้อมบันทึกวิดีโอ
npm run test:video:headed

# รันเจาะจงไฟล์หรือเคสพร้อมบันทึกวิดีโอ (ช้า step ละ 1 วินาที)
npm run test:video -- tests/stock.spec.ts
npm run test:video -- -g "TC-LOT-001"

# รันผ่าน Playwright UI Mode (Interactive Runner มี Timeline และ DOM Snapshot)
npm run test:ui

# รันในโหมด Debug ทีละขั้นตอน (Playwright Inspector)
npm run test:debug
# หรือ
npx playwright test tests/stock.spec.ts --debug
```

---

### 4.3 รันเจาะจงเฉพาะ Test Case หรือ Keyword

```bash
# รันเฉพาะ TC-LOT-001 (เพิ่มสินค้าใหม่สำเร็จ)
npx playwright test tests/stock.spec.ts -g "TC-LOT-001"

# รันเฉพาะ TC-LOT-007 (แก้ไขข้อมูลสินค้าสำเร็จ)
npx playwright test tests/stock.spec.ts -g "TC-LOT-007"

# รันเฉพาะ TC-LOT-008 (ลบสินค้าที่ไม่มีประวัติใช้งาน)
npx playwright test tests/stock.spec.ts -g "TC-LOT-008"

# รันเฉพาะ TC-INV-011 (ตรวจสอบแจ้งเตือน Toast)
npx playwright test tests/inventory-management.spec.ts -g "TC-INV-011"
```

---

### 4.4 ตรวจสอบ Type ของ TypeScript
```bash
npm run typecheck
```

---

## 5. การดูรายงานผลการทดสอบ (HTML Test Report)

เมื่อการทดสอบเสร็จสิ้น สามารถเปิดดูรายงานผลสรุปแบบละเอียดที่บันทึกขั้นตอน, ระยะเวลา, Call log, ภาพหน้าจอ และวิดีโอ ได้ด้วยคำสั่ง:

```bash
npm run test:report
# หรือ
npx playwright show-report
```

---

## 6. รายละเอียดชุดทดสอบตามเอกสาร (Test Specification Coverage)

### ชุด [`tests/stock.spec.ts`](tests/stock.spec.ts) (E2E Test Cases ตามเอกสาร Google Docs)
- **TC-LOT-001**: เพิ่มสินค้าใหม่สำเร็จ (ชื่อ: `"สบู่มะม่วง"`, หมวดหมู่: `"สบู่"`, ราคา: `119`, จำนวน: `15`, รายละเอียด: `"-"`, รูป: `"sabu.jpg"`) พร้อมตรวจ Toast Notification
- **TC-LOT-002**: เพิ่มสินค้าโดยไม่กรอกชื่อสินค้า ตรวจสอบ Validation Error สีแดง
- **TC-LOT-003**: ไม่เลือกหมวดหมู่สินค้า ตรวจสอบ Validation Error สีแดง
- **TC-LOT-004**: กรอกราคาสินค้าติดลบ (`-100`) ตรวจสอบแจ้งเตือน `"ราคาต้องไม่ต่ำกว่า 0"`
- **TC-LOT-005**: กรอกจำนวนสินค้าติดลบ (`-5`) ตรวจสอบแจ้งเตือน `"จำนวนต้องไม่ต่ำกว่า 0"`
- **TC-LOT-006**: อัปโหลดไฟล์ `.exe` หรือไฟล์ขนาดเกิน 5 MB ตรวจสอบ Toast ปฏิเสธไฟล์
- **TC-LOT-007**: แก้ไขข้อมูลสินค้าสำเร็จ ปรับราคา: `99`, จำนวน: `10`
- **TC-LOT-008**: ลบสินค้าที่ไม่มีประวัติใช้งาน พร้อมกดยืนยัน และตรวจสอบ Toast `"ลบสินค้าเรียบร้อยแล้ว"`
- **TC-LOT-009**: ลบสินค้าที่มีประวัติใช้งาน ตรวจสอบระบบป้องกันการลบตาม Business Rule
- **TC-LOT-010**: ค้นหาสินค้าด้วยชื่อ ตรวจสอบทั้งกรณีพบสินค้า และกรณี Empty State `"ไม่พบรายการสินค้าที่ค้นหา"`
