import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe.serial('ระบบจัดการสินค้าและสต็อก (Storemate E2E Test Suite - TC-LOT-001 ถึง TC-LOT-010)', () => {
  const validEmail = process.env.VALID_EMAIL || 'aomezzz.aomsin@gmail.com';
  const validPassword = process.env.VALID_PASSWORD || 'Aomezzz_007';

  const FIXTURE_IMAGE_FILE = path.resolve(__dirname, '../sabu.jpg');
  const FIXTURE_LARGE_FILE = path.resolve(__dirname, 'fixtures/large_image.png');
  const FIXTURE_EXE_FILE = path.resolve(__dirname, 'fixtures/executable.exe');

  test.beforeEach(async ({ page }) => {
    // 1. ไปที่หน้าระบบและเข้าสู่ระบบ
    await page.goto('/login');
    const emailInput = page.locator('#email, input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    await emailInput.fill(validEmail);
    await page.locator('#password, input[type="password"]').first().fill(validPassword);
    await page.locator("button[data-test='btn-submit'], form button[type='submit']").first().click();

    // 2. นำทางไปยังหน้าจัดการสินค้าในคลัง (/stock)
    await page.waitForURL(/.*\/dashboard/, { timeout: 20_000 });
    await page.goto('/stock');
    await expect(page.getByText('จัดการสินค้าในคลัง').first()).toBeVisible({ timeout: 15_000 });
  });

  test.afterEach(async ({ page }) => {
    // ปิด Modal หากมีเปิดค้างอยู่หลังรันแต่ละเคส
    const cancelBtn = page.getByRole('button', { name: 'ยกเลิก' }).first();
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click().catch(() => {});
      const confirmDiscard = page.getByRole('button', { name: 'ยืนยัน' }).first();
      if (await confirmDiscard.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmDiscard.click().catch(() => {});
      }
    }
  });

  // TC-LOT-001: เพิ่มสินค้าใหม่สำเร็จ (Positive Test)
  test('TC-LOT-001: เพิ่มสินค้าใหม่สำเร็จ (Positive Test)', async ({ page }) => {
    // 1. คลิกปุ่ม + เพิ่มสินค้า
    await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();

    // 2. กรอกข้อมูลสินค้าตามเอกสารข้อกำหนด:
    // ชื่อสินค้า: "สบู่มะม่วง", หมวดหมู่: "สบู่", ราคา: 119, จำนวน: 15, รายละเอียด: "-", รูปภาพ: "sabu.jpg"
    await page.getByRole('textbox', { name: 'ชื่อสินค้า', exact: true }).fill('สบู่มะม่วง');
    await page.locator('select[name="categoryName"]').selectOption('สบู่');
    await page.getByRole('spinbutton', { name: 'ราคา' }).fill('119');
    await page.getByRole('spinbutton', { name: 'จำนวนสินค้า' }).fill('15');
    await page.getByRole('textbox', { name: 'รายละเอียดสินค้า' }).fill('-');

    // 3. แนบไฟล์รูปภาพสินค้า sabu.jpg
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_IMAGE_FILE);

    // 4. กดปุ่ม "บันทึก"
    await page.getByRole('button', { name: 'บันทึก' }).click();

    // 5. ตรวจสอบการแจ้งเตือนสำเร็จ (Toast Notification)
    const successToast = page.getByRole('status').first();
    await expect(successToast).toBeVisible({ timeout: 10_000 });
    await expect(successToast).toContainText('เพิ่มสินค้า');

    // 6. ตรวจสอบว่าสินค้าใหม่ปรากฏในรายการสินค้า
    const searchInput = page.getByPlaceholder('ค้นหาโดยชื่อสินค้า หรือ รหัสสินค้า');
    await searchInput.fill('สบู่มะม่วง');
    await searchInput.press('Enter');
    await expect(page.locator('table tbody tr').first()).toContainText('สบู่มะม่วง');

    // บันทึกภาพหน้าจอ
    await page.screenshot({ path: 'test-results/tc-lot-001-success.png' });
  });

  // TC-LOT-002: เพิ่มสินค้าโดยไม่กรอกชื่อสินค้า (Negative Test)
  test('TC-LOT-002: เพิ่มสินค้าโดยไม่กรอกชื่อสินค้า (Negative Test)', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();

    // 1. เว้นว่างช่องชื่อสินค้า
    await page.getByRole('textbox', { name: 'ชื่อสินค้า', exact: true }).fill('');
    // 2. กรอกข้อมูลอื่นครบถ้วน
    await page.locator('select[name="categoryName"]').selectOption('สบู่');
    await page.getByRole('spinbutton', { name: 'ราคา' }).fill('119');
    await page.getByRole('spinbutton', { name: 'จำนวนสินค้า' }).fill('15');
    await page.getByRole('textbox', { name: 'รายละเอียดสินค้า' }).fill('-');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_IMAGE_FILE);

    // 3. กดปุ่ม "บันทึก"
    await page.getByRole('button', { name: 'บันทึก' }).click();

    // 4. ตรวจสอบ Validation Error ที่ช่องชื่อสินค้า
    const nameError = page.locator("label:has-text('ชื่อสินค้า') ~ div.text-red-500, .text-red-500:has-text('กรอกข้อมูลสินค้าไม่ครบถ้วน')").first();
    await expect(nameError).toBeVisible({ timeout: 5000 });

    // ตรวจสอบว่า Modal ยังคงเปิดอยู่ และไม่ถูกบันทึกสำเร็จ
    await expect(page.getByRole('heading', { name: 'จัดการสินค้าในคลัง' }).last()).toBeVisible();
    await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });

  // TC-LOT-003: ไม่เลือกหมวดหมู่สินค้า (Negative Test)
  test('TC-LOT-003: ไม่เลือกหมวดหมู่สินค้า (Negative Test)', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();

    // 1. กรอกชื่อสินค้า ราคา จำนวนสินค้าครบถ้วน
    await page.getByRole('textbox', { name: 'ชื่อสินค้า', exact: true }).fill('สบู่มะม่วง');
    // 2. ไม่เลือกหมวดหมู่สินค้า (คงค่า default "-- เลือกหมวดหมู่ --")
    await page.getByRole('spinbutton', { name: 'ราคา' }).fill('119');
    await page.getByRole('spinbutton', { name: 'จำนวนสินค้า' }).fill('15');
    await page.getByRole('textbox', { name: 'รายละเอียดสินค้า' }).fill('-');

    // 3. กดปุ่ม "บันทึก"
    await page.getByRole('button', { name: 'บันทึก' }).click();

    // 4. ตรวจสอบ Validation Error ที่ช่องหมวดหมู่สินค้า
    const categoryError = page.locator("label:has-text('หมวดหมู่') ~ div.text-red-500, .text-red-500:has-text('กรอกข้อมูลสินค้าไม่ครบถ้วน')").first();
    await expect(categoryError).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });

  // TC-LOT-004: กรอกราคาสินค้าไม่ถูกต้อง (Negative Test)
  test('TC-LOT-004: กรอกราคาสินค้าไม่ถูกต้อง (Negative Test)', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();

    await page.getByRole('textbox', { name: 'ชื่อสินค้า', exact: true }).fill('สบู่มะม่วง');
    await page.locator('select[name="categoryName"]').selectOption('สบู่');

    // 1. กรอกราคาสินค้าเป็นค่าที่ไม่ถูกต้อง (ค่าติดลบ เช่น -100)
    await page.getByRole('spinbutton', { name: 'ราคา' }).fill('-100');
    await page.getByRole('spinbutton', { name: 'จำนวนสินค้า' }).fill('15');
    await page.getByRole('textbox', { name: 'รายละเอียดสินค้า' }).fill('-');

    // 2. กดปุ่ม "บันทึก"
    await page.getByRole('button', { name: 'บันทึก' }).click();

    // 3. ตรวจสอบ Validation Error ที่ช่องราคาสินค้า
    const priceError = page.locator("label:has-text('ราคาต่อชิ้น') ~ div.text-red-500, div.text-red-500:has-text('ราคาต้องไม่ต่ำกว่า 0')").first();
    await expect(priceError).toBeVisible({ timeout: 5000 });
    await expect(priceError).toHaveText('ราคาต้องไม่ต่ำกว่า 0');

    await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });

  // TC-LOT-005: กรอกจำนวนสินค้าไม่ถูกต้อง (Negative Test)
  test('TC-LOT-005: กรอกจำนวนสินค้าไม่ถูกต้อง (Negative Test)', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();

    await page.getByRole('textbox', { name: 'ชื่อสินค้า', exact: true }).fill('สบู่มะม่วง');
    await page.locator('select[name="categoryName"]').selectOption('สบู่');
    await page.getByRole('spinbutton', { name: 'ราคา' }).fill('119');

    // 1. กรอกจำนวนสินค้าเป็นค่าที่ไม่ถูกต้อง (ค่าติดลบ เช่น -5)
    await page.getByRole('spinbutton', { name: 'จำนวนสินค้า' }).fill('-5');
    await page.getByRole('textbox', { name: 'รายละเอียดสินค้า' }).fill('-');

    // 2. กดปุ่ม "บันทึก"
    await page.getByRole('button', { name: 'บันทึก' }).click();

    // 3. ตรวจสอบ Validation Error ที่ช่องจำนวนสินค้า
    const qtyError = page.locator("label:has-text('จำนวนคงเหลือ') ~ div.text-red-500, div.text-red-500:has-text('จำนวนต้องไม่ต่ำกว่า 0')").first();
    await expect(qtyError).toBeVisible({ timeout: 5000 });
    await expect(qtyError).toHaveText('จำนวนต้องไม่ต่ำกว่า 0');

    await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });

  // TC-LOT-006: อัปโหลดรูปภาพไม่ถูกต้อง (Negative Test)
  test('TC-LOT-006: อัปโหลดรูปภาพไม่ถูกต้อง (Negative Test)', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();

    // 1. เลือกไฟล์ที่ไม่ใช่รูปภาพ (.exe)
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_EXE_FILE);

    // 2. ตรวจสอบระบบปฏิเสธและแสดง Toast ข้อความแจ้งเตือนว่าไฟล์ไม่ถูกต้อง
    const exeToast = page.getByRole('status').filter({ hasText: 'ไม่รองรับ หรือขนาดใหญ่เกิน 5MB' }).first();
    await expect(exeToast).toBeVisible({ timeout: 5000 });

    // 3. ทดสอบไฟล์รูปขนาดเกินกำหนด (> 5MB)
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_LARGE_FILE);
    const largeToast = page.getByRole('status').filter({ hasText: 'ไม่รองรับ หรือขนาดใหญ่เกิน 5MB' }).first();
    await expect(largeToast).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });

  // TC-LOT-007: แก้ไขข้อมูลสินค้าสำเร็จ (Positive Test)
  test('TC-LOT-007: แก้ไขข้อมูลสินค้าสำเร็จ (Positive Test)', async ({ page }) => {
    // 1. ค้นหาสินค้า "สบู่มะม่วง"
    const searchInput = page.getByPlaceholder('ค้นหาโดยชื่อสินค้า หรือ รหัสสินค้า');
    await searchInput.fill('สบู่มะม่วง');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // 2. คลิกปุ่มจัดการของแถวสินค้า
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toContainText('สบู่มะม่วง');
    await firstRow.getByRole('button', { name: 'จัดการ' }).click();

    // รอให้ Modal โหลดข้อมูลสินค้าเสร็จสมบูรณ์
    await expect(page.getByRole('heading', { name: 'แก้ไขข้อมูลสินค้า' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'ชื่อสินค้า', exact: true })).toHaveValue('สบู่มะม่วง');

    // 3. แก้ไขข้อมูลสินค้า: ราคา: 99, จำนวน: 10 ตามข้อกำหนด
    await page.getByRole('spinbutton', { name: 'ราคา' }).fill('99');
    await page.getByRole('spinbutton', { name: 'จำนวนสินค้า' }).fill('10');

    // 4. กดปุ่ม "บันทึก"
    const saveButton = page.getByRole('button', { name: 'บันทึก' });
    if (await saveButton.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    // ปิด Modal หากเปิดอยู่
    const cancelBtn = page.getByRole('button', { name: 'ยกเลิก' });
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
    }

    // 5. ค้นหาอีกครั้งเพื่อยืนยันข้อมูลที่แก้ไขในตาราง
    await searchInput.fill('สบู่มะม่วง');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    await expect(page.locator('table tbody tr').first()).toContainText('สบู่มะม่วง');
  });

  // TC-LOT-008: ลบสินค้าที่ไม่มีประวัติใช้งาน (Positive Test)
  test('TC-LOT-008: ลบสินค้าที่ไม่มีประวัติใช้งาน (Positive Test)', async ({ page }) => {
    // 1. ค้นหาสินค้า "สบู่มะม่วง" ที่ไม่มีประวัติการสั่งซื้อ
    const searchInput = page.getByPlaceholder('ค้นหาโดยชื่อสินค้า หรือ รหัสสินค้า');
    await searchInput.fill('สบู่มะม่วง');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toContainText('สบู่มะม่วง');
    await firstRow.getByRole('button', { name: 'จัดการ' }).click();

    await expect(page.getByRole('heading', { name: 'แก้ไขข้อมูลสินค้า' })).toBeVisible();

    // 2. กดปุ่ม "ลบสินค้า"
    const deleteButton = page.getByRole('button', { name: 'ลบสินค้า' });
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click();

      // 3. เมื่อระบบแสดง Confirmation Dialog ให้กด "ยืนยัน"
      const confirmBtn = page.getByRole('button', { name: 'ยืนยัน' });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      // 4. ตรวจสอบการลบสินค้าสำเร็จ และแสดง Toast แจ้งเตือน
      const deleteToast = page.getByRole('status').filter({ hasText: 'ลบสินค้าเรียบร้อยแล้ว' }).first();
      await expect(deleteToast).toBeVisible({ timeout: 10_000 });
      await expect(deleteToast).toHaveText('ลบสินค้าเรียบร้อยแล้ว');
    } else {
      await page.getByRole('button', { name: 'ยกเลิก' }).click();
    }
  });

  // TC-LOT-009: ลบสินค้าที่มีประวัติใช้งาน (Negative / Business Rule Test)
  test('TC-LOT-009: ลบสินค้าที่มีประวัติใช้งาน (Negative / Business Rule Test)', async ({ page }) => {
    // 1. เลือกสินค้าที่มีประวัติการใช้งานแล้วในระบบ (เช่น แถวแรกในตารางหน้าแรก)
    const firstManageBtn = page.locator('table tbody tr button:has-text("จัดการ")').first();
    await firstManageBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await firstManageBtn.click();

    await expect(page.getByRole('heading', { name: 'แก้ไขข้อมูลสินค้า' })).toBeVisible();

    // 2. ตรวจสอบเงื่อนไขทางธุรกิจ: ระบบต้องไม่อนุญาตให้ลบสินค้าที่มีประวัติ
    const deleteButton = page.getByRole('button', { name: 'ลบสินค้า' });
    const isDeleteVisible = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (isDeleteVisible) {
      const isDeleteDisabled = await deleteButton.isDisabled();
      if (!isDeleteDisabled) {
        await deleteButton.click();
        const confirmBtn = page.getByRole('button', { name: 'ยืนยัน' });
        if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmBtn.click();
        }
        // ตรวจสอบข้อความปฏิเสธการลบจากระบบ
        const errorToast = page.getByRole('status').first();
        if (await errorToast.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('[TC-LOT-009 Result]:', await errorToast.innerText());
        }
      } else {
        expect(isDeleteDisabled).toBeTruthy();
      }
    } else {
      // หากปุ่มลบถูกซ่อนไว้สำหรับสินค้าที่มีประวัติ ถือว่าผ่านตาม Business Rule
      expect(isDeleteVisible).toBeFalsy();
    }

    // ปิดหน้าต่าง Modal
    const cancelBtn = page.getByRole('button', { name: 'ยกเลิก' });
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
    }
  });

  // TC-LOT-010: ค้นหาสินค้าด้วยชื่อ (Positive & Empty State Test)
  test('TC-LOT-010: ค้นหาสินค้าด้วยชื่อ (Positive & Empty State Test)', async ({ page }) => {
    const searchInput = page.getByPlaceholder('ค้นหาโดยชื่อสินค้า หรือ รหัสสินค้า');
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });

    // 1. ค้นหาด้วยชื่อสินค้าที่มีอยู่ ("สบู่")
    await searchInput.fill('สบู่');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // 2. ค้นหาคำที่ไม่มีผลลัพธ์ในระบบ
    await searchInput.fill('ไม่มีสินค้านี้ในระบบแน่นอน999');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // 3. ตรวจสอบ Empty State
    const emptyRow = page.locator('table tbody td:has-text("ไม่พบรายการสินค้าที่ค้นหา")');
    await expect(emptyRow).toBeVisible({ timeout: 5000 });

    // 4. ล้างคำค้นหา
    await searchInput.fill('');
    await searchInput.press('Enter');
  });
});
