import { test } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { InventoryPage } from '../src/pages/InventoryPage';
import { log } from '../src/utils/test-logger';
import credentials from '../src/data/credentials.json';

test.beforeEach(async ({ page }) => {
  await new LoginPage(page).open();
});

test('TC-LOGIN-001: valid login navigates to inventory', async ({ page }) => {
  const login = new LoginPage(page);
  await test.step('enter valid credentials and submit', async () => {
    log.step(`logging in as ${credentials.validUser.username}`);
    await login.enterCredentials(credentials.validUser.username, credentials.validUser.password);
    await login.clickLogin();
  });
  await test.step('inventory page loads with product grid and cart', async () => {
    log.oracle('expecting /inventory.html, title "Swag Labs", .inventory_list visible');
    await new InventoryPage(page).expectLoaded();
  });
});

test('TC-LOGIN-002: invalid username shows credential-mismatch error', async ({ page }) => {
  const login = new LoginPage(page);
  await test.step('submit an unknown username', async () => {
    await login.enterCredentials(credentials.invalidUser.username, credentials.invalidUser.password);
    await login.clickLogin();
  });
  await test.step('mismatch error appears and user stays on login page', async () => {
    log.oracle('expecting "Username and password do not match..."');
    await login.expectCredentialMismatchError();
  });
});

test('TC-LOGIN-003: valid username with invalid password is rejected', async ({ page }) => {
  const login = new LoginPage(page);
  await test.step('submit a wrong password for a valid user', async () => {
    await login.enterCredentials(credentials.invalidPass.username, credentials.invalidPass.password);
    await login.clickLogin();
  });
  await test.step('mismatch error appears', async () => {
    await login.expectCredentialMismatchError();
  });
});

test('TC-LOGIN-004: empty credentials shows "Username is required"', async ({ page }) => {
  const login = new LoginPage(page);
  await test.step('attempt login with both fields empty', async () => {
    await login.enterCredentials(credentials.empty.username, credentials.empty.password);
    await login.clickLogin();
  });
  await test.step('required-field error appears', async () => {
    log.oracle('expecting "Epic sadface: Username is required"');
    await login.expectUsernameRequiredError();
  });
});

test('TC-LOGIN-005: locked out user is denied access', async ({ page }) => {
  const login = new LoginPage(page);
  await test.step('log in as locked-out user with correct password', async () => {
    await login.enterCredentials(credentials.lockedOutUser.username, credentials.lockedOutUser.password);
    await login.clickLogin();
  });
  await test.step('locked-out error appears and no redirect occurs', async () => {
    log.oracle('expecting "Sorry, this user has been locked out." and URL remains /');
    await login.expectLockedOutError();
  });
});
