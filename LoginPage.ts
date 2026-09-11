import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#user-name');
    this.passwordInput = page.locator('#password');
    this.loginButton   = page.locator('#login-button');
    this.errorBanner   = page.locator('[data-test="error"]');
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  async enterCredentials(username: string, password: string): Promise<void> {
    await this.fillAndVerify(this.usernameInput, username, 'username');
    await this.fillAndVerify(this.passwordInput, password, 'password');
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async loginAs(username: string, password: string): Promise<void> {
    await this.open();
    await this.enterCredentials(username, password);
    await this.clickLogin();
  }

  async expectCredentialMismatchError(): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toContainText(
      'Epic sadface: Username and password do not match any user in this service'
    );
    await expect(this.page).toHaveURL(/\/$/);
  }

  async expectUsernameRequiredError(): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toContainText('Epic sadface: Username is required');
  }

  async expectLockedOutError(): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toContainText('Epic sadface: Sorry, this user has been locked out.');
    await expect(this.page).toHaveURL(/\/$/);
  }
}
