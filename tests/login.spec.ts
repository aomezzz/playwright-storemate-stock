import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('StoreMate Authentication Tests', () => {
  let loginPage: LoginPage;
  const validEmail = process.env.VALID_EMAIL || 'aomezzz.aomsin@gmail.com';
  const validPassword = process.env.VALID_PASSWORD || 'Aomezzz_007';

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('TC01 - Login With Valid Credentials Should Succeed', {
    tag: ['@smoke', '@regression', '@login'],
  }, async ({ page }) => {
    // 1. กรอกข้อมูล Email และ Password ที่ถูกต้อง
    await loginPage.fillEmail(validEmail);
    await loginPage.fillPassword(validPassword);

    // 2. กดปุ่มเข้าสู่ระบบ
    await loginPage.submit();

    // 3. ตรวจสอบว่าระบบนำทางเข้าสู่หน้า Dashboard สำเร็จ
    await loginPage.verifyDashboardLoaded(validEmail);

    // 4. บันทึกภาพหน้าจอ
    await page.screenshot({ path: 'test-results/login-success.png', fullPage: true });
  });

  test('TC02 - Login With Invalid Password Should Fail', {
    tag: ['@negative', '@login'],
  }, async ({ page }) => {
    // 1. กรอก Email ถูกต้อง และกรอก Password ผิด
    await loginPage.fillEmail(validEmail);
    await loginPage.fillPassword('WrongPassword123!');

    // 2. กดปุ่มเข้าสู่ระบบ
    await loginPage.submit();

    // 3. หน่วงเวลาเล็กน้อย และตรวจสอบว่าไม่สามารถเข้าหน้า Dashboard ได้
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/dashboard');
  });

  test('TC03 - Login With Empty Password Should Show Validation', {
    tag: ['@negative', '@login'],
  }, async ({ page }) => {
    // 1. กรอกเฉพาะ Email และเว้นว่าง Password
    await loginPage.fillEmail(validEmail);

    // 2. กดปุ่มเข้าสู่ระบบ
    await loginPage.submit();

    // 3. ตรวจสอบว่าระบบยังคงอยู่ที่หน้าเดิม ไม่เข้า Dashboard
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/dashboard');
  });
});
