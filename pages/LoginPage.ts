import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly dashboardHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email, input[type="email"], input[placeholder*="email" i]');
    this.passwordInput = page.locator('#password, input[type="password"]');
    this.loginButton = page.locator("button[data-test='btn-submit'], main button:has-text('เข้าสู่ระบบ'), form button[type='submit'], button[data-test='login-button']");
    this.dashboardHeading = page.locator("h1:has-text('แดชบอร์ด'), :text('แดชบอร์ด')");
  }

  async goto(url: string = '/login') {
    await this.page.goto(url);
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.loginButton.first().click();
  }

  async login(email: string, password: string) {
    await this.goto('/login');
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async verifyDashboardLoaded(expectedEmail?: string) {
    await this.page.waitForURL(/.*\/dashboard/, { timeout: 15_000 });
    await expect(this.dashboardHeading.first()).toBeVisible({ timeout: 15_000 });
    if (expectedEmail) {
      await expect(this.page.getByText(expectedEmail).first()).toBeVisible({ timeout: 15_000 });
    }
  }

  async captureScreenshot(path: string) {
    await this.page.screenshot({ path, fullPage: true });
  }
}
