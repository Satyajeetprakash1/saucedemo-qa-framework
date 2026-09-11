# SauceDemo Login Automation — Playwright + AI-Assisted Test Design

**Author:** Satyajeet Prakash
**Assignment:** AI-Generated Test Case Builder + Script Execution
**Stack:** Playwright (TypeScript) · Page Object Model · GitHub Actions

---

## 1. What this project is

For this assignment I had to use an AI tool to design test cases from a requirement,
then automate at least one of them with Selenium, Playwright, or Cypress.

I picked [https://www.saucedemo.com](https://www.saucedemo.com) because it's a stable
public demo site with well-known users and predictable error messages — good for
showing clean, repeatable automation.

I chose **Playwright with TypeScript** over Selenium mainly for the built-in
auto-waiting and the trace/video capture on failure, which makes debugging in CI
much less painful. The framework uses a Page Object Model with data-driven tests.

One thing worth saying upfront: I used AI during the **design phase**, not to write
the framework for me. The prompt, the generated cases, and what I changed after
reviewing them are all documented below so the process is transparent.

---

## 2. How I used AI for test design

### The prompt I gave the tool

```javascript
You are a QA engineer. For the login page at https://www.saucedemo.com
(fields: Username, Password, Login button; users: standard_user, locked_out_user,
problem_user, performance_glitch_user; password: secret_sauce):
1. Generate exactly 5 test cases covering positive, negative and boundary paths.
2. For each: ID, Title, Preconditions, Steps (Given/When/Then), Test Data,
   Expected Result, Priority.
3. Then critique your own list — what risks did you miss? Classify each gap as
   "automate" or "manual/exploratory" and justify.
```

The third part is the one I found most useful. Asking the tool to find weaknesses in
its own output surfaced things I wouldn't have thought to ask for directly.

### What I kept, changed, and threw away

The tool's first draft was decent but generic — the kind of list anyone would write
for any login form. After reviewing it against the actual site, I made these changes:

- **Added the locked-out user case (TC-005).** The tool didn't know SauceDemo ships
with `locked_out_user`, and that business rule is one of the most interesting things
to test on this site. This came from reading the site's own docs.
- **Verified every expected error string against the real DOM.** The tool guessed at
error message wording; a couple were close but not exact. Wrong oracles would have
given me false positives, so I copied the real strings from the browser before
writing any assertions.
- **Pushed security cases out of scope.** The tool suggested SQL injection and XSS
cases. Those are worth testing, but not meaningfully through a UI automation suite —
I documented them as manual/exploratory items instead of pretending the automation
covers them.

---

## 3. Test Cases

### TC-LOGIN-001 — Valid login (Positive, P0)

- **Precondition:** User is on https://www.saucedemo.com
- **Steps:**
- GIVEN the login page is displayed
- WHEN the user enters username `standard_user` and password `secret_sauce`
- AND clicks the Login button
- **Expected Result:** User is redirected to `/inventory.html`; the product grid
(`.inventory_list`) is visible; page title is "Swag Labs"; the cart icon is present.
- **Priority:** P0

### TC-LOGIN-002 — Invalid username (Negative, P1)

- **Steps:** Enter username `invalid_user`, password `secret_sauce`, click Login.
- **Expected Result:** User stays on the login page; error banner shows
`Epic sadface: Username and password do not match any user in this service`.

### TC-LOGIN-003 — Valid username, wrong password (Negative, P1)

- **Steps:** Enter username `standard_user`, password `wrong_pass`, click Login.
- **Expected Result:** Same mismatch error as TC-002; user is not authenticated.

### TC-LOGIN-004 — Empty credentials (Boundary, P1)

- **Steps:** Leave both fields empty, click Login.
- **Expected Result:** Error banner shows `Epic sadface: Username is required`; no
navigation occurs.

### TC-LOGIN-005 — Locked-out user (Business rule, P0)

- **Steps:** Enter username `locked_out_user`, password `secret_sauce`, click Login.
- **Expected Result:** Access denied; banner shows
`Epic sadface: Sorry, this user has been locked out.`; user is NOT redirected.

### Risk log — gaps identified during design and how I handled them

| Risk | Decision | Why |
| --- | --- | --- |
| SQL injection in username field | Manual / security backlog | No real signal from UI automation; belongs in API/security testing |
| XSS in username field | Manual / security backlog | Needs CSP/header-level checks, not DOM assertions |
| Password masking + no credential persistence after failed login | Automated — folded into TC-002/003 | Quick DOM assertion, real regression value |
| Session cookie after successful login | Checked once manually via DevTools | One-time verification, not a regression candidate |
| Rate limiting / brute-force lockout | Out of scope | Demo site doesn't expose this behavior; documented as known gap |
| Accessibility (labels, keyboard navigation) | Manual / axe audit | Recommended follow-up, not part of this suite |

---

## 4. Project Structure

```javascript
saucedemo-qa-framework/
├── .github/workflows/playwright.yml   # CI: runs on push/PR + nightly schedule
├── src/
│   ├── pages/
│   │   ├── BasePage.ts                # shared helpers (navigation, guarded fills)
│   │   ├── LoginPage.ts               # login page object — actions and oracles
│   │   └── InventoryPage.ts           # post-login landing page
│   ├── data/
│   │   └── credentials.json           # test data, kept out of the specs
│   └── utils/
│       └── test-logger.ts             # [STEP]/[ORACLE] console logging
├── tests/
│   └── login.spec.ts                  # TC-LOGIN-001 .. 005
├── playwright.config.ts
├── .env.example
├── tsconfig.json
└── README.md
```

A note on the design: assertions live in the page objects, not the specs. This keeps
tests readable and means an oracle change only has to be fixed in one place.

---

## 5. How to run it

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone and enter the project
git clone <your-repo-url> && cd saucedemo-qa-framework

# 2. Install dependencies and browsers
npm install
npx playwright install --with-deps

# 3. Configure environment
cp .env.example .env

# 4. Run the full suite (headless, parallel)
npx playwright test

# 5. Run headed if you want to watch
npx playwright test --headed

# 6. Open the HTML report — includes traces, screenshots and video for failures
npx playwright show-report
```

Run a single case:

```bash
npx playwright test -g "TC-LOGIN-001"
```

**CI:** pushing to `main` or opening a PR triggers the workflow in
`.github/workflows/playwright.yml`. It also runs on a nightly cron, and the HTML
report is uploaded as an artifact.

---

## 6. Traceability

| Test Case | Spec | Data |
| --- | --- | --- |
| TC-LOGIN-001 Valid login | `login.spec.ts` | `standard_user` |
| TC-LOGIN-002 Invalid username | `login.spec.ts` | `invalid_user` |
| TC-LOGIN-003 Wrong password | `login.spec.ts` | `wrong_pass` |
| TC-LOGIN-004 Empty fields | `login.spec.ts` | empty strings |
| TC-LOGIN-005 Locked-out user | `login.spec.ts` | `locked_out_user` |

The assignment asked for at least one automated test case. I automated all five
because the data-driven setup made it basically free once the first one worked —
and it demonstrates the framework scales without adding new code per case.

---

## 7. Retrospective: AI in Test Design

A few honest takeaways from doing it this way:

- **AI was fastest at the work I didn't want to do anyway.** Formatting test cases,
writing Given/When/Then steps, drafting a coverage matrix — that's boilerplate.
Having it drafted in a couple of minutes let me spend my time on the parts that
actually need a human: verifying oracles against the real site, deciding what's
in scope for automation, and building the POM and CI setup properly.
- **The self-critique step was the real value.** The best output wasn't the test
list — it was the list of risks *behind* the test list. I'd use that approach again.
- **The tool was confidently wrong about details.** Error message wording, mostly.
If I'd pasted its expected results straight into assertions, two of my five tests
would have been broken on day one. Anything the tool states as fact about a UI
needs to be eyeballed in the browser before you trust it.
- **Net effect:** design time dropped from what I'd estimate at 45+ minutes of
grinding to about 10 minutes of review and correction. The time saved went into
the framework itself, which is where the long-term value is anyway.
