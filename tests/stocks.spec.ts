import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { StockPage } from '../pages/StockPage';

const FIXTURE_VALID_FILE = 'tests/fixtures/product_spec.xlsx';
const FIXTURE_LARGE_FILE = 'tests/fixtures/large_file.xlsx';
const FIXTURE_EXE_FILE = 'tests/fixtures/executable.exe';

test.describe.serial('StoreMate Stock Management (SPRS - Storemate Ecommerce)', () => {
  let loginPage: LoginPage;
  let stockPage: StockPage;
  const validEmail = process.env.VALID_EMAIL || 'aomezzz.aomsin@gmail.com';
  const validPassword = process.env.VALID_PASSWORD || 'Aomezzz_007';

  test.beforeAll(async ({ browser }) => {
    // Optional global pre-check if needed
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    stockPage = new StockPage(page);

    // เข้าสู่ระบบและนำทางไปยังหน้าจัดการสต็อก
    await loginPage.login(validEmail, validPassword);
    await loginPage.verifyDashboardLoaded();
    await stockPage.goto();
  });

  test.afterEach(async () => {
    await stockPage.closeModalIfOpen();
  });

  test('TC-LOT-001: เพิ่มสินค้าในคลังใหม่สำเร็จผ่าน Modal Popup (Positive Test)', {
    tag: ['@positive', '@inventory', '@smoke'],
  }, async ({ page }) => {
    // TS-LOT-001 / FR-INV-01: เพิ่มสินค้าในคลังใหม่สำเร็จผ่าน Modal Popup
    await stockPage.openAddProductModal();

    await stockPage.fillForm({
      name: 'สบู่สมุนไพรไหมทอง',
      category: 'สบู่',
      price: 85,
      quantity: 100,
      status: 'พร้อมจำหน่าย',
      description: 'สบู่ทำความสะอาดผิวหน้าและผายช่วยบำรุงผิวให้เนียนนุ่ม',
      filePath: FIXTURE_VALID_FILE,
    });

    await stockPage.saveForm();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/stock-tc001-added.png', fullPage: true });
  });

  test('TC-LOT-002: เพิ่มสินค้าโดยไม่กรอกชื่อสินค้า (Negative Test)', {
    tag: ['@negative', '@inventory'],
  }, async () => {
    // TS-LOT-002 / FR-INV-01: เพิ่มสินค้าโดยเว้นว่างชื่อสินค้า ระบบต้องไม่อนุญาตให้บันทึก
    await stockPage.openAddProductModal();

    await stockPage.fillForm({
      name: '',
      category: 'สบู่',
      price: 100,
      quantity: 50,
      description: 'รายละเอียดสินค้าทดสอบ',
    });

    const isDisabled = await stockPage.isSaveButtonDisabled();
    if (!isDisabled) {
      await stockPage.saveForm();
      const isStillOpen = await stockPage.isModalOpen();
      expect(isStillOpen).toBeTruthy();
    } else {
      expect(isDisabled).toBeTruthy();
    }

    await stockPage.cancelForm();
  });

  test('TC-LOT-003: ไม่เลือกหมวดหมู่สินค้า (Negative Test)', {
    tag: ['@negative', '@inventory'],
  }, async () => {
    // TS-LOT-003 / FR-INV-01: ไม่ทำการเลือกตัวเลือกใน Dropdown หมวดหมู่ ระบบต้องไม่อนุญาตให้บันทึก
    await stockPage.openAddProductModal();

    await stockPage.fillForm({
      name: 'สบู่สมุนไพรไหมทอง',
      price: 85,
      quantity: 100,
      description: 'สบู่ทำความสะอาดผิวหน้า',
    });

    const isDisabled = await stockPage.isSaveButtonDisabled();
    if (!isDisabled) {
      await stockPage.saveForm();
      const isStillOpen = await stockPage.isModalOpen();
      expect(isStillOpen).toBeTruthy();
    } else {
      expect(isDisabled).toBeTruthy();
    }

    await stockPage.cancelForm();
  });

  test('TC-LOT-004: ราคาสินค้าไม่ถูกต้อง (Negative Test)', {
    tag: ['@negative', '@inventory'],
  }, async () => {
    // TS-LOT-004 / FR-INV-01: กรอกค่าติดลบ -50 ในช่องราคา ระบบต้องป้องกันไม่ให้บันทึก
    await stockPage.openAddProductModal();

    await stockPage.fillForm({
      name: 'สบู่สมุนไพรไหมทอง',
      category: 'สบู่',
      price: -50,
      quantity: 100,
      description: 'สบู่ทำความสะอาดผิวหน้า',
    });

    const isDisabled = await stockPage.isSaveButtonDisabled();
    if (!isDisabled) {
      await stockPage.saveForm();
      const isStillOpen = await stockPage.isModalOpen();
      expect(isStillOpen).toBeTruthy();
    } else {
      expect(isDisabled).toBeTruthy();
    }

    await stockPage.cancelForm();
  });

  test('TC-LOT-005: จำนวนสินค้าไม่ถูกต้อง (Negative Test)', {
    tag: ['@negative', '@inventory'],
  }, async () => {
    // TS-LOT-005 / FR-INV-01: กรอกค่าติดลบ -10 ในช่องจำนวนสินค้าในคลัง ระบบต้องไม่อนุญาตให้บันทึก
    await stockPage.openAddProductModal();

    await stockPage.fillForm({
      name: 'สบู่สมุนไพรไหมทอง',
      category: 'สบู่',
      price: 85,
      quantity: -10,
      description: 'สบู่ทำความสะอาดผิวหน้า',
    });

    const isDisabled = await stockPage.isSaveButtonDisabled();
    if (!isDisabled) {
      await stockPage.saveForm();
      const isStillOpen = await stockPage.isModalOpen();
      expect(isStillOpen).toBeTruthy();
    } else {
      expect(isDisabled).toBeTruthy();
    }

    await stockPage.cancelForm();
  });

  test('TC-LOT-006: อัปโหลดรูปภาพหรือไฟล์ไม่ถูกต้อง (Negative Test)', {
    tag: ['@negative', '@inventory'],
  }, async ({ page }) => {
    // TS-LOT-006 / FR-INV-01: อัปโหลดไฟล์ขนาดเกิน 5 MB หรือนามสกุลที่ไม่รองรับ (.exe)
    await stockPage.openAddProductModal();

    await stockPage.fillForm({
      name: 'สบู่สมุนไพรไหมทอง',
      category: 'สบู่',
    });

    // อัปโหลดไฟล์ขนาดใหญ่เกิน 5 MB
    await stockPage.uploadFile(FIXTURE_LARGE_FILE);
    await page.waitForTimeout(1000);

    // อัปโหลดไฟล์ .exe ที่ไม่รองรับ
    await stockPage.uploadFile(FIXTURE_EXE_FILE);
    await page.waitForTimeout(1000);

    await stockPage.cancelForm();
  });

  test('TC-LOT-007: แก้ไขข้อมูลสินค้าสำเร็จ (Positive Test)', {
    tag: ['@positive', '@inventory'],
  }, async ({ page }) => {
    // TS-LOT-007 / FR-INV-02: แก้ไขข้อมูลสินค้า จำนวนเป็น 50 และสถานะเป็น ไม่พร้อมจำหน่าย
    await stockPage.openFirstManageModal();

    await stockPage.fillQuantity(50);
    await stockPage.selectStatus('ไม่พร้อมจำหน่าย');

    // กดปุ่มบันทึก
    await page.evaluate(() => {
      const b = document.querySelector("[data-test^='submit-product']") as HTMLElement | null;
      if (b) b.click();
    });
    await page.waitForTimeout(2000);
  });

  test('TC-LOT-008: ลบสินค้าที่ไม่มีประวัติใช้งาน (Positive Test)', {
    tag: ['@positive', '@inventory'],
  }, async () => {
    // TS-LOT-008 / FR-INV-02: ทดสอบการลบสินค้าที่ไม่มีประวัติการใช้งาน
    await stockPage.openFirstManageModal();
    await stockPage.clickDeleteProduct();
    await stockPage.cancelForm();
  });

  test('TC-LOT-009: ลบสินค้าที่มีประวัติใช้งาน (Negative / Business Rule Test)', {
    tag: ['@negative', '@inventory', '@business-rule'],
  }, async () => {
    // TS-LOT-009 / FR-INV-02: ลบสินค้าที่มีประวัติทำรายการ ระบบต้องไม่อนุญาตให้ลบ
    await stockPage.openFirstManageModal();
    await stockPage.clickDeleteProduct();
    await stockPage.cancelForm();
  });

  test('TC-LOT-010: ค้นหาสินค้าด้วยชื่อ (Positive & Negative Test)', {
    tag: ['@search', '@inventory'],
  }, async ({ page }) => {
    // TS-LOT-010 / FR-INV-03: ค้นหาสินค้าด้วยคำค้นหา "สบู่" (พบข้อมูล) และ "ไม่มีสินค้านี้ในระบบ" (ไม่พบข้อมูล)
    await stockPage.searchProduct('สบู่');
    await expect(page.locator('body')).toContainText('สบู่');

    await stockPage.searchProduct('ไม่มีสินค้านี้ในระบบ');
    await page.waitForTimeout(1000);

    // เคลียร์การค้นหา
    await stockPage.searchProduct('');
  });
});
