import { Page, Locator, expect } from '@playwright/test';
import * as path from 'path';

export interface ProductFormData {
  name?: string;
  category?: string;
  price?: string | number;
  quantity?: string | number;
  status?: string;
  description?: string;
  filePath?: string;
}

export class StockPage {
  readonly page: Page;
  readonly sidebarStockBtn: Locator;
  readonly addProductBtn: Locator;
  readonly searchInput: Locator;
  readonly modalContainer: Locator;
  readonly productNameInput: Locator;
  readonly categorySelect: Locator;
  readonly priceInput: Locator;
  readonly stockQuantityInput: Locator;
  readonly statusSelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebarStockBtn = page.locator("button[data-test='stock-button'], a:has-text('จัดการสินค้าในคลัง'), button:has-text('จัดการสินค้าในคลัง')");
    this.addProductBtn = page.locator("button:has-text('เพิ่มสินค้า')");
    this.searchInput = page.locator("input[placeholder*='ค้นหาโดยชื่อสินค้า']");
    this.modalContainer = page.locator("div.fixed.backdrop-blur, div.fixed:has(input[name='productName'], input[placeholder='ชื่อสินค้า'])");
    this.productNameInput = page.locator("input[name='productName'], input[placeholder='ชื่อสินค้า']");
    this.categorySelect = page.locator("select[name='categoryName']");
    this.priceInput = page.locator("input[name='price'], input[placeholder='ราคา']");
    this.stockQuantityInput = page.locator("input[name='stockQuantity'], input[placeholder='จำนวนสินค้า']");
    this.statusSelect = page.locator("select[name='status']");
    this.descriptionTextarea = page.locator("textarea[name='description'], textarea[placeholder='รายละเอียดสินค้า']");
    this.fileInput = page.locator("input[type='file']");
    this.submitButton = page.locator("button[data-test^='submit-product'], button:has-text('บันทึก')");
    this.cancelButton = page.locator("button[data-test='cancel-edit-product'], button:has-text('ยกเลิก')");
    this.deleteButton = page.locator("button[data-test^='delete-product'], button:has-text('ลบสินค้า')");
    this.toast = page.locator("[role='status'], .go4109123758, [role='alert']");
    this.tableRows = page.locator('table tbody tr');
    this.emptyState = page.locator('table tbody tr td:has-text("ไม่พบรายการสินค้าที่ค้นหา")');
  }

  readonly toast: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;

  async goto() {
    // Try navigation via UI first, otherwise direct URL
    try {
      if (await this.sidebarStockBtn.first().isVisible({ timeout: 3000 })) {
        await this.sidebarStockBtn.first().click();
        await this.page.waitForURL(/.*\/stock/, { timeout: 10_000 });
      } else {
        await this.page.goto('/stock');
      }
    } catch {
      await this.page.goto('/stock');
    }
    await this.page.waitForURL(/.*\/stock/, { timeout: 15_000 });
    await expect(this.page.getByText('จัดการสินค้าในคลัง').first()).toBeVisible({ timeout: 15_000 });
  }

  async openAddProductModal() {
    await this.closeModalIfOpen();
    await this.addProductBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.addProductBtn.first().click();
    await this.productNameInput.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async fillProductName(name: string) {
    await this.productNameInput.first().fill(name);
  }

  async selectCategory(category: string) {
    if (category) {
      await this.categorySelect.first().selectOption({ label: category });
    }
  }

  async fillPrice(price: string | number) {
    await this.priceInput.first().fill(String(price));
  }

  async fillQuantity(quantity: string | number) {
    await this.stockQuantityInput.first().fill(String(quantity));
  }

  async selectStatus(status: string) {
    if (status) {
      await this.statusSelect.first().selectOption({ label: status });
    }
  }

  async fillDescription(description: string) {
    await this.descriptionTextarea.first().fill(description);
  }

  async uploadFile(filePath: string) {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    // Make file input interactable if hidden by styles
    await this.page.evaluate(() => {
      const el = document.querySelector("input[type='file']") as HTMLInputElement | null;
      if (el) {
        el.style.opacity = '1';
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.width = '100px';
        el.style.height = '30px';
      }
    });
    await this.fileInput.first().setInputFiles(resolvedPath);
  }

  async fillForm(data: ProductFormData) {
    if (data.name !== undefined) {
      await this.fillProductName(data.name);
    }
    if (data.category !== undefined) {
      await this.selectCategory(data.category);
    }
    if (data.price !== undefined) {
      await this.fillPrice(data.price);
    }
    if (data.quantity !== undefined) {
      await this.fillQuantity(data.quantity);
    }
    if (data.status !== undefined) {
      await this.selectStatus(data.status);
    }
    if (data.description !== undefined) {
      await this.fillDescription(data.description);
    }
    if (data.filePath !== undefined) {
      await this.uploadFile(data.filePath);
    }
  }

  async saveForm() {
    await this.submitButton.first().click();
  }

  async cancelForm() {
    const cancelBtn = this.page.locator("button[data-test='cancel-edit-product'], button:has-text('ยกเลิก')").first();
    if (await cancelBtn.count() > 0) {
      await cancelBtn.scrollIntoViewIfNeeded().catch(() => {});
      await cancelBtn.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);

      // Check if discard confirmation dialog appears: "คุณต้องการละทิ้งการเปลี่ยนแปลงหรือไม่?"
      const confirmDiscardBtn = this.page.locator("button:has-text('ยืนยัน')").first();
      if (await confirmDiscardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmDiscardBtn.click();
        await this.page.waitForTimeout(500);
      }
    }
    await this.page.waitForTimeout(500);
    if (await this.isModalOpen()) {
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(300);
    }
    await this.modalContainer.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }

  async closeModalIfOpen() {
    const isModalOpen = await this.modalContainer.first().isVisible().catch(() => false);
    if (isModalOpen) {
      await this.cancelForm();
    }
    await this.page.locator("div.fixed.backdrop-blur-sm, div.fixed:has(input[name='productName'])").first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async isSaveButtonDisabled(): Promise<boolean> {
    const btn = this.submitButton.first();
    const isDisabledAttr = await btn.isDisabled().catch(() => false);
    const hasDisabledClass = await btn.evaluate(el => el.classList.contains('disabled') || el.hasAttribute('disabled')).catch(() => false);
    return isDisabledAttr || hasDisabledClass;
  }

  async isModalOpen(): Promise<boolean> {
    return await this.productNameInput.first().isVisible().catch(() => false);
  }

  async searchProduct(keyword: string) {
    await this.searchInput.first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.searchInput.first().fill(keyword);
    await this.searchInput.first().press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async openFirstManageModal() {
    await this.closeModalIfOpen();
    await this.page.waitForTimeout(500);
    // Click manage button on first table row
    const manageBtn = this.page.locator("table button[data-test^='menagemate-product']").first();
    if (await manageBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await manageBtn.click();
    } else {
      await this.page.evaluate(() => {
        const b = document.querySelector("table button[data-test^='menagemate-product']") as HTMLElement | null;
        if (b) b.click();
      });
    }
    await this.modalContainer.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async clickDeleteProduct() {
    if (await this.deleteButton.first().isVisible().catch(() => false)) {
      await this.deleteButton.first().click();
    } else {
      await this.page.evaluate(() => {
        const b = document.querySelector("[data-test^='delete-product']") as HTMLElement | null;
        if (b) b.click();
      });
    }
    await this.page.waitForTimeout(1000);
  }

  async captureScreenshot(path: string) {
    await this.page.screenshot({ path, fullPage: true });
  }
}
