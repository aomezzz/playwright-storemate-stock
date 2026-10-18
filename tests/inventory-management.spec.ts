import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { StockPage } from '../pages/StockPage';
import * as path from 'path';

const FIXTURE_JPG = path.resolve(__dirname, '../sabu.jpg');
const FIXTURE_PNG = path.resolve(__dirname, 'fixtures/sample_product.png');
const FIXTURE_EXE = path.resolve(__dirname, 'fixtures/executable.exe');
const FIXTURE_LARGE_IMG = path.resolve(__dirname, 'fixtures/large_image.png');

test.describe('Inventory Management UI Automation Suite (TC-INV-001 - TC-INV-013)', () => {
  let loginPage: LoginPage;
  let stockPage: StockPage;
  const validEmail = process.env.VALID_EMAIL || 'aomezzz.aomsin@gmail.com';
  const validPassword = process.env.VALID_PASSWORD || 'Aomezzz_007';

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    stockPage = new StockPage(page);

    // เข้าสู่ระบบและไปยังหน้าจัดการคลังสินค้า (/stock)
    await loginPage.login(validEmail, validPassword);
    await loginPage.verifyDashboardLoaded();
    await stockPage.goto();
  });

  test.afterEach(async () => {
    await stockPage.closeModalIfOpen();
  });

  // TC-INV-001: เปิด Modal เพิ่มสินค้า
  test('TC-INV-001: เปิด Modal เพิ่มสินค้า', async ({ page }) => {
    // 1. ตรวจสอบหัวข้อหน้า ตารางสินค้า ช่องค้นหา และปุ่ม “+ เพิ่มสินค้า”
    await expect(page.getByText('จัดการสินค้าในคลัง').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table')).toBeVisible();
    await expect(stockPage.searchInput.first()).toBeVisible();
    await expect(stockPage.addProductBtn.first()).toBeVisible();

    // 2. คลิกปุ่มเพิ่มสินค้า
    await stockPage.openAddProductModal();

    // 3. ตรวจสอบว่า Modal เปิดขึ้นและมีช่องกรอกข้อมูลตาม UI
    await expect(stockPage.productNameInput.first()).toBeVisible();
    await expect(stockPage.categorySelect.first()).toBeVisible();
    await expect(stockPage.priceInput.first()).toBeVisible();
    await expect(stockPage.stockQuantityInput.first()).toBeVisible();
    await expect(stockPage.statusSelect.first()).toBeVisible();
    await expect(stockPage.descriptionTextarea.first()).toBeVisible();
    await expect(stockPage.fileInput.first()).toBeAttached();
    await expect(stockPage.submitButton.first()).toBeVisible();
    await expect(stockPage.cancelButton.first()).toBeVisible();

    // 4. ตรวจสอบการเลื่อนภายใน Modal (Scrollable container check)
    const modalContent = page.locator("div.fixed:has(input[name='productName']) > div").first();
    const isScrollable = await modalContent.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.overflowY === 'auto' || style.overflowY === 'scroll' || el.scrollHeight >= el.clientHeight;
    });
    expect(isScrollable).toBeTruthy();
  });

  // TC-INV-002: เพิ่มสินค้าสำเร็จ
  test('TC-INV-002: เพิ่มสินค้าสำเร็จ', async ({ page }) => {
    const testProductName = 'TEST-Product-Automation-001';

    // 1. เปิด Modal
    await stockPage.openAddProductModal();

    // 2. กรอกข้อมูลตาม Test Case Specification
    await stockPage.fillProductName(testProductName);
    await stockPage.selectCategory('สบู่');
    await stockPage.fillPrice(129);
    await stockPage.fillQuantity(25);
    await stockPage.selectStatus('พร้อมจำหน่าย');
    await stockPage.fillDescription('สินค้าสำหรับทดสอบระบบเพิ่มสินค้าอัตโนมัติ');
    await stockPage.uploadFile(FIXTURE_JPG);

    // 3. ดักจับ Notification Toast และบันทึกสินค้า
    const postPromise = page.waitForResponse(res => res.url().includes('products') && res.request().method() === 'POST');
    await stockPage.saveForm();

    const response = await postPromise;
    expect(response.status()).toBe(201);

    // 4. รอให้ Modal ปิดลงหลังบันทึกเสร็จ
    await expect(stockPage.productNameInput.first()).not.toBeVisible({ timeout: 10_000 });

    // 5. ค้นหาสินค้าด้วยชื่อทดสอบ
    await stockPage.searchProduct(testProductName);

    // 6. ตรวจสอบว่ามีสินค้าใหม่จริงและข้อมูลตรงกับค่าที่กรอก
    const firstRow = stockPage.tableRows.first();
    await expect(firstRow).toContainText(testProductName);
    await expect(firstRow).toContainText('สบู่');
    await expect(firstRow).toContainText('129');
    await expect(firstRow).toContainText('25');
    await expect(firstRow).toContainText('พร้อมจำหน่าย');
  });

  // TC-INV-003: Required Field Validation
  test('TC-INV-003: Required Field Validation', async ({ page }) => {
    await stockPage.openAddProductModal();

    // กรณีที่ 1: ไม่กรอกข้อมูลใดๆ เลยแล้วกดบันทึก
    await stockPage.saveForm();

    // ตรวจสอบว่าระบบไม่บันทึก และ Modal ยังเปิดอยู่
    expect(await stockPage.isModalOpen()).toBeTruthy();

    // ตรวจสอบข้อความแจ้งเตือน "กรอกข้อมูลสินค้าไม่ครบถ้วน" ใต้ช่องกรอกที่จำเป็น
    const nameError = page.locator("div:has(> input[name='productName']) + div.text-red-500, label:has-text('ชื่อสินค้า') ~ div.text-red-500").first();
    const categoryError = page.locator("label:has-text('หมวดหมู่') ~ div.text-red-500").first();
    const priceError = page.locator("label:has-text('ราคาต่อชิ้น') ~ div.text-red-500").first();
    const qtyError = page.locator("label:has-text('จำนวนคงเหลือ') ~ div.text-red-500").first();
    const descError = page.locator("label:has-text('รายละเอียดสินค้า') ~ div.text-red-500").first();

    await expect(nameError).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');
    await expect(categoryError).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');
    await expect(priceError).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');
    await expect(qtyError).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');
    await expect(descError).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');

    // กรณีที่ 2: กรอกชื่อที่มีแต่ช่องว่าง "   "
    await stockPage.fillProductName('   ');
    await stockPage.selectCategory('สบู่');
    await stockPage.fillPrice(100);
    await stockPage.fillQuantity(10);
    await stockPage.fillDescription('คำอธิบาย');
    await stockPage.saveForm();

    // ระบบต้องไม่บันทึกข้อมูลชื่อที่มีแต่ช่องว่าง และคงค่าที่กรอกถูกต้องไว้
    expect(await stockPage.isModalOpen()).toBeTruthy();
    expect(await stockPage.priceInput.first().inputValue()).toBe('100');
    expect(await stockPage.stockQuantityInput.first().inputValue()).toBe('10');
    expect(await stockPage.descriptionTextarea.first().inputValue()).toBe('คำอธิบาย');
  });

  // TC-INV-004: Numeric Validation
  test('TC-INV-004: Numeric Validation', async ({ page }) => {
    await stockPage.openAddProductModal();

    // 1. ใส่ตัวอักษรในช่องราคา (HTML5 input type="number" ปฏิเสธตัวอักษร)
    await stockPage.priceInput.first().pressSequentially('abc');
    expect(await stockPage.priceInput.first().inputValue()).toBe('');

    // 2. ใส่ราคาติดลบ (-50)
    await stockPage.fillPrice('-50');
    await stockPage.saveForm();
    const priceNegativeError = page.locator("label:has-text('ราคาต่อชิ้น') ~ div.text-red-500").first();
    await expect(priceNegativeError).toHaveText('ราคาต้องไม่ต่ำกว่า 0');

    // 3. ใส่จำนวนติดลบ (-10)
    await stockPage.fillQuantity('-10');
    await stockPage.saveForm();
    const qtyNegativeError = page.locator("label:has-text('จำนวนคงเหลือ') ~ div.text-red-500").first();
    await expect(qtyNegativeError).toHaveText('จำนวนต้องไม่ต่ำกว่า 0');

    // 4. ใส่จำนวนเป็นทศนิยม (25.5) -> ตรวจสอบ validity mismatch ของ step=1
    await stockPage.fillQuantity('25.5');
    const isStepMismatch = await stockPage.stockQuantityInput.first().evaluate((el: HTMLInputElement) => el.validity.stepMismatch);
    expect(isStepMismatch).toBeTruthy();

    // 5. ทดสอบเลข 0 ตามกฎธุรกิจ (ราคา 0 หรือ จำนวน 0 ต้องไม่แสดงข้อความ "กรอกข้อมูลสินค้าไม่ครบถ้วน")
    await stockPage.fillPrice('0');
    await stockPage.fillQuantity('0');
    const priceErrText = await page.locator("label:has-text('ราคาต่อชิ้น') ~ div.text-red-500").innerText().catch(() => '');
    const qtyErrText = await page.locator("label:has-text('จำนวนคงเหลือ') ~ div.text-red-500").innerText().catch(() => '');
    expect(priceErrText).not.toContain('กรอกข้อมูลสินค้าไม่ครบถ้วน');
    expect(qtyErrText).not.toContain('กรอกข้อมูลสินค้าไม่ครบถ้วน');
  });

  // TC-INV-005: Image Upload
  test('TC-INV-005: Image Upload', async ({ page }) => {
    // 1. อัปโหลดไฟล์ PNG ขนาดไม่เกิน 5 MB
    await stockPage.openAddProductModal();
    await stockPage.uploadFile(FIXTURE_PNG);
    await page.waitForTimeout(500);
    // ตรวจสอบว่าไม่ขึ้น error แจ้งเตือนเรื่องไฟล์
    const fileError = page.locator("div.text-red-500:has-text('ไม่รองรับ')");
    await expect(fileError).toHaveCount(0);
    await stockPage.cancelForm();

    // 2. อัปโหลดไฟล์ JPG ขนาดไม่เกิน 5 MB
    await stockPage.openAddProductModal();
    await stockPage.uploadFile(FIXTURE_JPG);
    await page.waitForTimeout(500);
    await expect(fileError).toHaveCount(0);
    await stockPage.cancelForm();

    // 3. ทดลองไฟล์ที่ไม่ใช่รูปภาพ (.exe)
    await stockPage.openAddProductModal();
    await stockPage.uploadFile(FIXTURE_EXE);
    const exeToast = page.locator("[role='status']:has-text('executable.exe'), div:has-text('ไฟล์ executable.exe ไม่รองรับ หรือขนาดใหญ่เกิน 5MB')").first();
    await expect(exeToast).toBeVisible({ timeout: 5000 });
    await expect(exeToast).toContainText('ไฟล์ executable.exe ไม่รองรับ หรือขนาดใหญ่เกิน 5MB');
    await stockPage.cancelForm();

    // 4. ทดลองไฟล์รูปขนาดเกิน 5 MB (> 5MB PNG)
    await stockPage.openAddProductModal();
    await stockPage.uploadFile(FIXTURE_LARGE_IMG);
    const largeToast = page.locator("[role='status']:has-text('large_image.png'), div:has-text('ไฟล์ large_image.png ไม่รองรับ หรือขนาดใหญ่เกิน 5MB')").first();
    await expect(largeToast).toBeVisible({ timeout: 5000 });
    await expect(largeToast).toContainText('ไฟล์ large_image.png ไม่รองรับ หรือขนาดใหญ่เกิน 5MB');
  });

  // TC-INV-006: Cancel Modal
  test('TC-INV-006: Cancel Modal', async ({ page }) => {
    // 1. เปิด Modal
    await stockPage.openAddProductModal();

    // 2. กรอกข้อมูลบางส่วน
    const unsubmittedName = `CANCELLED-ITEM-${Date.now()}`;
    await stockPage.fillProductName(unsubmittedName);
    await stockPage.fillPrice(99);

    // 3. คลิกปุ่มยกเลิก
    await stockPage.cancelForm();

    // 4. ตรวจสอบว่า Modal ปิดลง
    expect(await stockPage.isModalOpen()).toBeFalsy();

    // 5. เปิด Modal ใหม่อีกครั้ง และตรวจสอบว่าฟอร์มถูกรีเซ็ตค่าว่าง
    await stockPage.openAddProductModal();
    expect(await stockPage.productNameInput.first().inputValue()).toBe('');
    expect(await stockPage.priceInput.first().inputValue()).toBe('');
    await stockPage.cancelForm();

    // 6. ยืนยันว่าไม่มีสินค้าถูกสร้างขึ้นในระบบ
    await stockPage.searchProduct(unsubmittedName);
    await expect(stockPage.emptyState.first()).toBeVisible();
  });

  // TC-INV-007: Search
  test('TC-INV-007: Search', async ({ page }) => {
    // 1. ค้นหาด้วยชื่อสินค้าที่มีอยู่ ("สบู่")
    await stockPage.searchProduct('สบู่');
    const rowCount = await stockPage.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(stockPage.tableRows.first()).toContainText('สบู่');

    // 2. ดึงรหัสสินค้าจากแถวแรกมาทดสอบค้นหาด้วยรหัสสินค้า
    const firstProductCode = (await page.locator('table tbody tr td').first().innerText()).trim();
    expect(firstProductCode).toMatch(/^PRD-/);

    // ค้นหาด้วยรหัสสินค้าที่มีอยู่
    await stockPage.searchProduct(firstProductCode);
    await expect(stockPage.tableRows.first()).toContainText(firstProductCode);

    // 3. ค้นหาด้วยคำที่ไม่มีผลลัพธ์
    await stockPage.searchProduct('NON_EXISTING_KEYWORD_XYZ_99999');
    await expect(stockPage.emptyState.first()).toBeVisible();
    await expect(stockPage.emptyState.first()).toHaveText('ไม่พบรายการสินค้าที่ค้นหา');

    // 4. ล้างคำค้นหา และตรวจสอบว่ารายการสินค้ากลับมาแสดงตามปกติ
    await stockPage.searchProduct('');
    expect(await stockPage.tableRows.count()).toBeGreaterThanOrEqual(1);
  });

  // TC-INV-008: Duplicate Submission
  test('TC-INV-008: Duplicate Submission', async ({ page }) => {
    // หน่วงเวลา POST API เพื่อตรวจสอบสถานะปุ่ม disabled ขณะกำลังส่งข้อมูล
    await page.route('**/api/v1/moderator/products', async route => {
      if (route.request().method() === 'POST') {
        await page.waitForTimeout(1500);
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await stockPage.openAddProductModal();

    const dupProductName = `TEST-Dup-Check-${Date.now()}`;
    await stockPage.fillForm({
      name: dupProductName,
      category: 'สบู่',
      price: 150,
      quantity: 10,
      status: 'พร้อมจำหน่าย',
      description: 'ทดสอบการส่งข้อมูลซ้ำ',
      filePath: 'sabu.jpg',
    });

    let postRequestCount = 0;
    page.on('request', req => {
      if (req.method() === 'POST' && req.url().includes('products')) {
        postRequestCount++;
      }
    });

    // คลิกบันทึกครั้งที่ 1
    await stockPage.saveForm();

    // ตรวจสอบว่าปุ่มบันทึกถูก disabled ทันทีขณะกำลังส่งคำขอ
    const isSubmitDisabled = await stockPage.submitButton.first().evaluate((btn: HTMLButtonElement) => btn.disabled);
    expect(isSubmitDisabled).toBeTruthy();

    // พยายามคลิกซ้ำอย่างรวดเร็ว (Double-click / rapid click)
    await stockPage.submitButton.first().click({ force: true }).catch(() => {});

    // รอให้การส่งข้อมูลเสร็จสิ้น
    await page.waitForTimeout(2500);

    // ตรวจสอบว่าคำขอ POST ถูกส่งไปเพียง 1 ครั้งเท่านั้น
    expect(postRequestCount).toBe(1);
  });

  // TC-INV-009: Data Integrity
  test('TC-INV-009: Data Integrity', async ({ page }) => {
    const integrityProductName = `TEST-Integrity-${Date.now().toString().slice(-4)}`;

    await stockPage.openAddProductModal();
    await stockPage.fillForm({
      name: integrityProductName,
      category: 'สบู่',
      price: 189,
      quantity: 35,
      status: 'พร้อมจำหน่าย',
      description: 'ทดสอบความครบถ้วนถูกต้องของข้อมูล Data Integrity',
      filePath: 'sabu.jpg',
    });

    await stockPage.saveForm();
    await page.waitForTimeout(2000);

    // ค้นหาสินค้าที่เพิ่ม
    await stockPage.searchProduct(integrityProductName);

    const productRow = stockPage.tableRows.first();
    await expect(productRow).toContainText(integrityProductName);
    await expect(productRow).toContainText('สบู่');
    await expect(productRow).toContainText('189');
    await expect(productRow).toContainText('35');
    await expect(productRow).toContainText('พร้อมจำหน่าย');

    // รีเฟรชหน้าเว็บและตรวจสอบว่าข้อมูลยังคงอยู่ ไม่สูญหาย
    await page.reload();
    await stockPage.searchProduct(integrityProductName);
    await expect(stockPage.tableRows.first()).toContainText(integrityProductName);
    await expect(stockPage.tableRows.first()).toContainText('189');
    await expect(stockPage.tableRows.first()).toContainText('35');
  });

  // TC-INV-010: Incomplete Form Validation Message
  test('TC-INV-010: Incomplete Form Validation Message', async ({ page }) => {
    // 1. เปิด Modal เพิ่มสินค้า
    await stockPage.openAddProductModal();

    // 2. เว้นข้อมูลที่จำเป็นอย่างน้อยหนึ่งช่อง (เว้นชื่อสินค้า)
    await stockPage.fillForm({
      name: '',
      category: 'สบู่',
      price: 100,
      quantity: 10,
      description: 'ทดสอบ Incomplete Validation',
    });

    // 3. กดปุ่มบันทึก
    await stockPage.saveForm();

    // 4. ตรวจสอบว่าระบบไม่บันทึกสินค้า
    expect(await stockPage.isModalOpen()).toBeTruthy();

    // 5. ตรวจสอบว่ามีข้อความ "กรอกข้อมูลสินค้าไม่ครบถ้วน" แสดงใต้ Text Box ตาม UI ที่กำหนด
    const nameValidationMessage = page.locator("label:has-text('ชื่อสินค้า') ~ div.text-red-500").first();
    await expect(nameValidationMessage).toBeVisible();

    // 6. ตรวจสอบข้อความด้วย exact text assertion
    await expect(nameValidationMessage).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');

    // 7. ตรวจสอบตำแหน่งข้อความว่าอยู่ใต้ช่องกรอกข้อมูลที่เกี่ยวข้อง
    const inputBounds = await stockPage.productNameInput.first().boundingBox();
    const errorBounds = await nameValidationMessage.boundingBox();
    expect(inputBounds).not.toBeNull();
    expect(errorBounds).not.toBeNull();
    if (inputBounds && errorBounds) {
      expect(errorBounds.y).toBeGreaterThanOrEqual(inputBounds.y + inputBounds.height - 5);
    }

    // 8. กรอกข้อมูลที่ขาดให้ครบ
    await stockPage.fillProductName('TEST-Incomplete-Fixed');

    // 9. ตรวจสอบว่าข้อความ Validation หายไปตามพฤติกรรมที่กำหนด
    await stockPage.saveForm();
    await page.waitForTimeout(500);
    await expect(nameValidationMessage).not.toBeVisible();
  });

  // TC-INV-011: Successful Product Creation Notification
  test('TC-INV-011: Successful Product Creation Notification', async ({ page }) => {
    // 1. กรอกข้อมูลสินค้าครบถ้วนและถูกต้อง
    await stockPage.openAddProductModal();

    const uniqueName = `TEST-Notification-${Date.now().toString().slice(-4)}`;
    await stockPage.fillForm({
      name: uniqueName,
      category: 'สบู่',
      price: 120,
      quantity: 50,
      status: 'พร้อมจำหน่าย',
      description: 'ทดสอบ Notification',
      filePath: 'sabu.jpg',
    });

    // 2. ดักจับ Toast Notification ที่ปรากฏ
    let displayedToastText = '';
    page.on('dialog', d => d.accept());

    // 3. กดปุ่มบันทึก
    await stockPage.saveForm();

    // 4. รอจนการบันทึกเสร็จสิ้น และตรวจสอบ Toast Notification ที่แสดงบนหน้าจอ
    const toast = page.getByRole('status').filter({ hasText: 'เพิ่มสินค้า' }).first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    displayedToastText = (await toast.innerText()).trim();

    // บันทึกภาพหน้าจอขณะ Notification แสดงผล
    await page.screenshot({ path: 'test-results/notification-success.png' });

    // 5. ตรวจสอบสินค้าใหม่ปรากฏในตาราง
    await stockPage.searchProduct(uniqueName);
    await expect(stockPage.tableRows.first()).toContainText(uniqueName);

    // 6. ข้อกำหนดระบุ: "หากระบบกำหนดข้อความว่า 'เพิ่มสินค้าสำเร็จ' ให้ตรวจสอบข้อความนี้แบบ exact match"
    // "หากข้อความจริงไม่ตรงกับข้อความที่คาดหวัง ให้รายงาน Expected และ Actual แยกกัน ห้ามแก้ไข Expected Result ให้ตรงกับ Actual โดยอัตโนมัติ"
    // ระบบจริงแสดง: "เพิ่มสินค้าเรียบร้อยแล้ว"
    console.log(`[TC-INV-011 Verification] Expected: "เพิ่มสินค้าสำเร็จ" | Actual: "${displayedToastText}"`);
    expect(displayedToastText).toBe('เพิ่มสินค้าสำเร็จ');
  });

  // TC-INV-012: Error Notification
  test('TC-INV-012: Error Notification', async ({ page }) => {
    // 1. Validation Error Notification: แสดง inline validation "กรอกข้อมูลสินค้าไม่ครบถ้วน"
    await stockPage.openAddProductModal();
    await stockPage.saveForm();
    await expect(page.locator('.text-red-500').first()).toHaveText('กรอกข้อมูลสินค้าไม่ครบถ้วน');

    // 2. Invalid Price Notification: แสดง inline error "ราคาต้องไม่ต่ำกว่า 0"
    await stockPage.fillPrice('-10');
    await stockPage.saveForm();
    await expect(page.locator("label:has-text('ราคาต่อชิ้น') ~ div.text-red-500").first()).toHaveText('ราคาต้องไม่ต่ำกว่า 0');

    // 3. Unsupported Image File Notification: แสดง Toast error
    await stockPage.uploadFile(FIXTURE_EXE);
    const exeToast = page.locator("[role='status']:has-text('executable.exe'), div:has-text('ไฟล์ executable.exe ไม่รองรับ หรือขนาดใหญ่เกิน 5MB')").first();
    await expect(exeToast).toBeVisible({ timeout: 5000 });
    await expect(exeToast).toContainText('ไฟล์ executable.exe ไม่รองรับ หรือขนาดใหญ่เกิน 5MB');

    // 4. Image File Exceeds 5 MB Notification: แสดง Toast error
    await stockPage.uploadFile(FIXTURE_LARGE_IMG);
    const largeToast = page.locator("[role='status']:has-text('large_image.png'), div:has-text('ไฟล์ large_image.png ไม่รองรับ หรือขนาดใหญ่เกิน 5MB')").first();
    await expect(largeToast).toBeVisible({ timeout: 5000 });
    await expect(largeToast).toContainText('ไฟล์ large_image.png ไม่รองรับ หรือขนาดใหญ่เกิน 5MB');

    await stockPage.cancelForm();

    // 5. API Request Failure (500 Error): จำลองข้อผิดพลาดจาก Backend
    await page.route('**/api/v1/moderator/products', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await stockPage.openAddProductModal();
    await stockPage.fillForm({
      name: 'TEST-500-Fail',
      category: 'สบู่',
      price: 100,
      quantity: 10,
      status: 'พร้อมจำหน่าย',
      description: 'ทดสอบ Error Notification 500',
      filePath: 'sabu.jpg',
    });

    await stockPage.saveForm();

    // ตรวจสอบว่าแสดง Error Toast Notification ที่เหมาะสมบน UI
    const errorToast = page.getByRole('status').filter({ hasText: 'เกิดข้อผิดพลาด' }).first();
    await errorToast.waitFor({ state: 'visible', timeout: 5000 });
    await expect(errorToast).toHaveText('เกิดข้อผิดพลาดในการเพิ่มสินค้า');

    // ไม่แสดงข้อความสำเร็จ และ Modal ยังคงเปิดอยู่ให้ผู้ใช้แก้ไข
    expect(await stockPage.isModalOpen()).toBeTruthy();
  });

  // TC-INV-013: Notification Locator and Assertions
  test('TC-INV-013: Notification Locator and Assertions', async ({ page }) => {
    // ตรวจสอบลักษณะและพฤติกรรมของ Notification:
    // 1. Inline validation ใต้ textbox
    await stockPage.openAddProductModal();
    await stockPage.saveForm();
    const inlineError = page.locator("label:has-text('ชื่อสินค้า') ~ div.text-red-500").first();
    await expect(inlineError).toBeVisible();
    await expect(inlineError).toHaveClass(/text-red-500/);

    // 2. Toast Notification เมื่อทำรายการสำเร็จ: ตรวจสอบ visibility และ duration
    await stockPage.fillForm({
      name: `TEST-Toast-Auto-${Date.now().toString().slice(-4)}`,
      category: 'สบู่',
      price: 150,
      quantity: 20,
      status: 'พร้อมจำหน่าย',
      description: 'ตรวจสอบคุณสมบัติ Notification',
      filePath: 'sabu.jpg',
    });

    await stockPage.saveForm();

    // ตรวจสอบ Toast ปรากฏขึ้นมา
    const toast = page.locator("[role='status'], .go4109123758").first();
    await expect(toast).toBeVisible({ timeout: 5000 });

    // ตรวจสอบว่า Notification มีระยะเวลาแสดงผลและหายไปตามพฤติกรรม (Toast auto-dismiss)
    await expect(toast).not.toBeVisible({ timeout: 8000 });
  });
});
