# PRD: Household Finance Manager (v2.0 — Master, Mobile-First)

> **v2.0 merges the original PRD (v1.0) with the Mobile-First UX Addendum into a single source of truth, and adds two new capabilities: (1) relative due-day scheduling for fixed expenses, and (2) an alerting system with Telegram support.** Mobile-first requirements are now embedded directly inside each relevant module rather than kept as a separate addendum. Where the two source documents disagreed on field lists, this document is canonical.

---

## Changelog from v1.0 / Mobile Addendum

* Mobile-first is now the default design posture for every module, not an appendix.
* `ExpenseTemplates.dueDay` is now formally specified end-to-end: how it's set, how it resolves into an `Expense.dueDate` on month creation, and how edge cases (e.g. day 31 in a 30-day month) are handled.
* New Module 14 — Fixed Expense Due-Day Scheduling.
* New Module 15 — Alerts & Notifications (in-app + Telegram).
* New database tables: `NotificationSettings`, `NotificationLog`, `TelegramLinks`.
* One deliberate, narrowly-scoped exception to the "no scheduled jobs" principle: a daily Vercel Cron Job for notification dispatch (see Module 15). Month creation itself remains lazy/on-open, unchanged from v1.0.
* Reconciled the expense table (desktop) and expense card (mobile) field lists into one canonical field list.
* Added session timeout, login rate-limiting, secrets management, and backup notes to Non-Functional Requirements.

---

# 1. Project Overview

### Project Name
**Household Finance Manager**

### Purpose
A lightweight, modern, password-protected web application for two users to manage household finances: monthly income, expenses, bank account balances, recurring bills, pending/completed payments, cash flow, inter-account transfers, and now due-date awareness with proactive alerts.

The application must be usable end-to-end from a phone in under two minutes per month, while also serving as the daily source of truth for household finances — checked primarily on mobile, configured primarily on desktop.

The application must be simple, fast, visually clean, mobile-first, and require virtually zero maintenance.

---

# 2. Technology Stack

## Frontend
* Next.js (latest App Router)
* TypeScript
* TailwindCSS
* shadcn/ui
* Chart.js

## Backend
* Next.js Server Actions
* Next.js Route Handlers
* No Express. No separate backend. No REST framework unless required.

## Database
* Turso SQLite
* Drizzle ORM

## Authentication
* Credentials login — username & password
* bcrypt password hashing
* JWT session, HttpOnly cookies
* Exactly two predefined users. No signup, no registration, no self-serve password reset.
* Session timeout: configurable, default 30 days sliding expiry (mobile users should not need to re-login constantly).
* Login attempts rate-limited (e.g. exponential backoff after 5 failed attempts) to protect the two accounts.

## Alerts / Notifications (new)
* In-app notification center (toast + persistent list)
* Telegram Bot API for push-style alerts to each user's linked Telegram account
* Vercel Cron Job (single daily trigger) for due-date alert evaluation — see Module 15

## Hosting
* Frontend + Backend: Vercel
* Database: Turso
* Secrets (JWT secret, Turso credentials, Telegram bot token): Vercel encrypted environment variables — never committed, never exposed to the client bundle

---

# 3. Design Principles

* Mobile-first, progressively enhanced for tablet and desktop
* Fast, extremely simple, easy to maintain
* Clean UI, dark mode by default
* No unnecessary complexity, minimal clicks
* Production quality
* Fully configurable from the UI — no hardcoded categories, templates, or accounts
* Feels like a polished personal finance app, not a spreadsheet

---

# 4. Supported Screen Sizes & Responsive Behavior

* Minimum width: 360px
* Common Android widths (390px, 412px, 430px), iPhone widths, tablets, desktop
* Fully usable in portrait; landscape optional but must not break layout
* No horizontal scrolling anywhere
* Desktop tables convert to card layouts automatically below tablet breakpoint
* Sticky headers for any table that remains a table (desktop)

---

# 5. Overall Monthly Workflow

1. Login
2. Open current month (auto-created if it doesn't exist — Module 7)
3. Enter salaries / income
4. Verify recurring (templated) expenses, including due days
5. Edit variable expenses; add one-off expenses if needed
6. Save (auto-save on edit)
7. Throughout the month: mark expenses Paid as payments happen (one tap on mobile)
8. Receive due-date alerts (in-app + Telegram) ahead of upcoming fixed expenses
9. View dashboard to monitor balances and follow transfer recommendations
10. Record transfers when recommended

---

# 6. Navigation

## Mobile
* Sticky bottom navigation bar, always visible
* Tabs: Dashboard · Month · Transfers · Reports · Settings
* Active tab always visually highlighted
* No hamburger menu for primary sections — every core destination is one tap away

## Desktop
* Left sidebar with icons + labels, expandable to accounts/categories/templates management

---

# 7. Module 1 – Authentication

* Login screen (username, password)
* Logout
* Session persistence with sliding timeout
* Protected routes on every non-auth page
* Rate-limited login attempts

---

# 8. Module 2 – Dashboard

Landing page after login. Must prioritize glanceability, especially on mobile where cards stack vertically in this order:

1. Total Income
2. Budgeted Expenses
3. Paid Expenses
4. Pending Expenses
5. Remaining Budget
6. Current Cash Available
7. Projected Month-End Balance
8. Savings (amount + percentage)

**New:** an "Upcoming Due Dates" card showing the next 3–5 fixed expenses by resolved due date this month, each with days-remaining and funding status (see Module 14).

## Charts (resize automatically, remain readable on mobile)
* Expense by Category — pie
* Monthly Expenses (last 12 months) — bar
* Monthly Savings — line
* Income vs Expense — stacked bar
* Account Balances — horizontal bar
* Category Spending — horizontal bar

## Transfer Recommendations
Shown prominently on the dashboard (and on the Month screen — Module 9), each with Source Account, Destination Account, Recommended Amount, and Reason. Users can record the transfer immediately from this card.

---

# 9. Module 3 – Monthly Finance Screen

Primary working screen. Contents: current month header, income entries, expense list, account summary, transfer recommendations, upcoming due-date strip (new — Module 14).

## Income Section
Multiple entries allowed. Fields: Description, Amount, Credited To (account), Date, Notes.
Examples: Siddharth Salary, Isha Salary, Bonus, Interest, Refund.

## Canonical Expense Field List
(Reconciles the v1.0 table and the mobile-addendum card into one list used everywhere.)

* Expense Name
* Category
* Amount
* Fixed (boolean)
* **Due Day (relative, e.g. "5th of every month") — for fixed expenses; see Module 14**
* Due Date (resolved absolute date for the current month)
* Paid From Account
* Status — Pending / Paid / Skipped
* Paid Date
* Notes
* Delete

## Desktop Layout
Sortable table with inline editing, search, filter, sort, duplicate row, delete row, add row, sticky header, auto-save.

## Mobile Layout
Individual cards, not spreadsheet rows. Each card shows: Expense Name, Category, Amount, Status, Due Date, Paid From Account, and a one-tap **Mark Paid** button. Tapping the card opens a bottom sheet / modal for full editing — single tap to edit, quick save, immediate return to the previous screen. Avoid multi-step editing flows.

## Quick Actions (always accessible)
* Add Income
* Add Expense
* Record Transfer
* Mark Expense Paid

On mobile these sit near the top of the Month screen and/or as a floating action button.

---

# 10. Module 4 – Bank Account Management

Fields: Account Name, Owner, Account Type (Bank Account / Cash / Wallet / Credit Card), Opening Balance, Active, Display Order.

Create, edit, delete, reorder, activate, deactivate. Historical data must never break — deletion is blocked while historical records reference the account; user is prompted to reassign first.

Account cards (mobile & desktop) display: Current Balance, Pending Expenses, Projected Balance. Accounts needing additional funds are visually highlighted — and now also drive the funding-alert text in Module 15.

---

# 11. Module 5 – Category Management

Fields: Name, Icon, Color, Display Order, Active. Add, edit, delete, reorder. Deletion requires reassignment of existing expenses.

---

# 12. Module 6 – Expense Template Management

Fully configurable, never hardcoded. Fields:

* Expense Name
* Category
* Default Amount
* Default Paying Account
* Fixed Expense
* **Due Day (1–31, optional — the relative recurrence day; new, see Module 14)**
* Enabled
* Display Order
* Notes

Create, edit, delete, enable, disable, duplicate, search, sort.

---

# 13. Module 7 – Automatic Month Creation

No cron job for this step — it remains lazy, triggered by the user opening the app, exactly as in v1.0.

**Logic:** if the current month exists, open it; otherwise create it by copying the previous month's enabled templates, amounts, payment accounts, categories, fixed flags, **due days**, and notes; set all expenses to Pending; clear paid dates; leave income empty. The month is immediately editable.

**New step:** for every copied fixed expense with a Due Day, resolve it into an absolute `dueDate` for the new month (see Module 14's resolution rule) as part of this same creation step — no separate job required.

---

# 14. Module 8 – Expense Status

Status values: Pending, Paid, Skipped.

Marking Paid: Paid Date defaults to today (editable); account balance, dashboard, and reports update immediately; also cancels any pending due-date alerts for that expense (Module 15). Reverting Paid → Pending reverses the balance adjustment and re-arms alerts if the due date is still upcoming.

---

# 15. Module 9 – Transfer Planner

Continuously calculates projected balances and recommends transfers to cover shortfalls, minimizing the number of transfers while ensuring no source account drops below its own projected obligations. Recommendations recalculate whenever income, expenses, expense status, payment account, or transfers change.

Recommendations feed directly into the funding-alert wording in Module 15 (e.g. "keep Account X funded for ₹Y ahead of Expense Z").

---

# 16. Module 10 – Manual Transfers

Fields: From Account, To Account, Amount, Date, Notes, Status (Pending / Completed). Completed transfers immediately update balances.

---

# 17. Module 11 – History

Browse, open, edit, and save every month. Historical months remain fully editable; all reports update automatically on edit.

---

# 18. Module 12 – Reports

Periods: Current Month, Current Year, Previous Year.

Charts: Monthly Spending, Monthly Savings, Income Trend, Expense Trend, Category Trend, Account Balance Trend.

Statistics: Highest Expense, Largest Category, Highest Spending Month, Average Monthly Expense, Average Monthly Savings.

Export: CSV, Excel.

---

# 19. Module 13 – Settings

* Change Password
* Theme: Dark (default) / Light / System
* Currency: default ₹
* **New: Notifications** — see Module 15 for the Telegram linking flow and alert preferences housed here

---

# 20. Module 14 – Fixed Expense Due-Day Scheduling *(new)*

### Purpose
Let fixed expenses (rent, EMI, subscriptions, utilities) carry a **relative recurrence day** — "1st of every month," "5th of every month" — so every month automatically knows a concrete due date without re-entry, and the app can show/alert on it.

### Data Model Addition
* `ExpenseTemplates.dueDay` — integer 1–31, optional. Only meaningful when `fixed = true`.
* `Expenses.dueDate` — already exists in v1.0; now explicitly documented as the **resolved, absolute date** for that specific month, derived from `dueDay` at month-creation time (Module 7) or set manually for non-templated / one-off expenses.

### Resolution Rule (dueDay → dueDate)
When a month is created (or a template is applied), resolve the due date as:

```
resolvedDay = min(dueDay, lastDayOf(month, year))
dueDate = date(year, month, resolvedDay)
```

This means a template with `dueDay = 31` correctly resolves to Feb 28 (or 29) in February, Apr 30 in April, etc. This clamping behavior is the default and should be a documented, predictable rule — not configurable in v1, to avoid edge-case complexity.

Editing an expense's `dueDate` for one specific month is always allowed and never alters the template's `dueDay` — only that month's instance changes (consistent with how amount/account overrides already work per v1.0).

### UI Requirements
* Template editor (Module 6): a simple "Due day of month" numeric/dropdown input (1–31), shown only when Fixed is enabled.
* Month screen: expenses can be sorted/grouped by resolved due date, so the current month's fixed expenses are viewable **date-wise** (a simple calendar-order list, not just a flat table) — this directly satisfies the "see expenses of current month date-wise" requirement.
* Dashboard "Upcoming Due Dates" card (Module 2) reads directly from resolved `dueDate` values.
* Optional lightweight calendar/timeline view on the Month screen showing each fixed expense pinned to its resolved date — mobile: vertical date-grouped list; desktop: can additionally offer a month-grid calendar view.

### Business Rules
* `dueDay` is only applicable to Fixed expenses; variable/one-off expenses use a direct `dueDate` as today.
* Skipped or Paid expenses still retain their resolved `dueDate` for historical/reporting purposes; only Pending expenses with a future `dueDate` participate in alerting (Module 15).

---

# 21. Module 15 – Alerts & Notifications: In-App + Telegram *(new)*

### Purpose
Proactively remind users of upcoming fixed-expense due dates and tell them which account needs funding and by how much — e.g.:

> "Rent is due on the 2nd of August. Please keep your HDFC Savings account funded with ₹25,000."

### Design Note — the one deliberate exception to "no scheduled jobs"
Month creation (Module 7) stays lazy and event-driven, unchanged. Alerts, however, must fire even if nobody opens the app that day — a Telegram message can't wait for a page load. This PRD therefore introduces **one** narrowly-scoped Vercel Cron Job, running once daily, whose only responsibility is: scan Pending fixed expenses with a `dueDate` inside the configured lead window, and dispatch alerts that haven't already been sent. This does not reintroduce general scheduled-job complexity elsewhere in the app.

### Alert Triggering Logic
* Runs once daily (default: 08:00 IST, configurable via env var).
* For each Pending, Fixed expense where `dueDate` falls within the user's configured lead time (default: 1 day before due date, configurable per user in Settings — options: same day, 1 day before, 3 days before, 7 days before):
  * Compute the funding amount needed in the `paymentAccountId` for that expense, cross-referenced against the Transfer Planner (Module 9) so the message reflects real shortfall, not just the raw expense amount.
  * Compose message: expense name, resolved due date, target account, amount to keep funded, and — if a shortfall exists — the recommended transfer to close it.
  * Deliver via every channel the user has enabled (in-app, Telegram, or both).
  * Log the send in `NotificationLog` so the same alert is never repeated for the same expense/month/channel.
* Marking the expense Paid, or Skipped, immediately suppresses any further alerts for that expense-month.

### Data Model Additions
**NotificationSettings**
* id
* userId
* leadTimeDays (default 1)
* inAppEnabled (default true)
* telegramEnabled (default false)
* dailySendHour (default 8, user-local)
* createdAt / updatedAt

**TelegramLinks**
* id
* userId
* telegramChatId
* linkedAt
* status (pending / active / revoked)

**NotificationLog**
* id
* expenseId
* monthId
* channel (in_app / telegram)
* sentAt
* messagePreview

### Telegram Linking Flow (Settings → Notifications)
1. User taps "Connect Telegram" in Settings.
2. App generates a short-lived, single-use link code and shows a deep link to the household's Telegram bot (`t.me/<bot>?start=<code>`).
3. User taps it, bot receives `/start <code>`, backend verifies the code and stores the resulting `telegramChatId` against that user, status becomes `active`.
4. User can disconnect at any time (status → `revoked`); no messages are sent to a revoked link.
5. Bot token stored only as a server-side encrypted environment variable — never sent to the client.

### In-App Notification Center
* Bell icon (mobile: in top bar; desktop: sidebar) with unread badge count.
* Tapping opens a simple reverse-chronological list of past alerts, each linking directly to the relevant expense.
* Toasts for alerts generated while the user is actively in-app.
* Screen-reader announcement (ARIA live region) when a new alert toast appears, consistent with the app's accessibility requirements.

### Settings UI (Module 13 extension)
* Notification lead time selector
* Toggle: In-app alerts
* Toggle: Telegram alerts (disabled until a Telegram account is linked)
* Connect / Disconnect Telegram button with live connection status

### Business Rules
* Alerts are advisory only — exactly like Transfer Recommendations — and never modify balances or expense status.
* No duplicate alert for the same expense + month + channel (enforced via `NotificationLog`).
* If a user has no channels enabled, the daily job still evaluates but sends nothing (no silent failures — surfaced in the in-app notification center as "Notifications are off" state).
* Telegram delivery failures (e.g. bot blocked by user) must not crash the daily job for other users/expenses — failures are caught, logged, and the link's status can be surfaced as needing reconnection.

---

# 22. Forms (Touch Optimization)

* Numeric keypad for amount fields
* Native date picker (used both for manual `dueDate` overrides and one-off expense dates)
* Large dropdown selectors
* Minimum touch target size: 44×44px
* Proper spacing between controls

---

# 23. Loading Experience

Skeleton loaders everywhere; no blank screens; navigation between pages should feel instant.

---

# 24. Theme Support

Dark / Light / System. Dark mode is the default.

---

# 25. Progressive Web App (PWA)

* Installable from Android and iPhone browsers
* Home screen icon, splash screen, standalone app mode
* Offline shell (app loads even if live data is unavailable; full offline data editing is not required)
* Theme color matches selected theme
* Note: PWA installability is separate from Telegram alerts — Telegram is the primary "push" channel in v2.0 since web push requires additional permission flows on iOS Safari that are out of scope for this version.

---

# 26. Performance Requirements

* Initial page load under 2 seconds on typical 4G
* Fast navigation between pages
* Optimistic UI updates where appropriate
* Efficient rendering, minimal unnecessary re-renders
* Optimized images and icons
* The daily notification cron job must complete well within Vercel's function time limits even as historical data grows — query only the current month's Pending/Fixed expenses, not full history

---

# 27. Accessibility

* Sufficient color contrast
* Keyboard accessibility on desktop
* Visible focus states
* Screen-reader-friendly labels
* Large touch targets on mobile
* ARIA live region for in-app alert toasts (new, ties to Module 15)

---

# 28. Database Design (Full Schema)

## Users
id · username · passwordHash · displayName · createdAt

## Accounts
id · name · owner · type · openingBalance · active · sortOrder · createdAt · updatedAt

## Categories
id · name · icon · color · active · sortOrder · createdAt · updatedAt

## ExpenseTemplates
id · name · categoryId · defaultAmount · paymentAccountId · fixed · **dueDay (new)** · enabled · notes · sortOrder · createdAt · updatedAt

## Months
id · year · month · monthKey (YYYY-MM, unique) · notes · createdAt

## Income
id · monthId · description · amount · accountId · receivedDate · notes · createdAt

## Expenses
id · monthId · templateId (nullable) · name · categoryId · amount · paymentAccountId · fixed · status · dueDate · paidDate · notes · displayOrder · createdAt · updatedAt

## Transfers
id · monthId · fromAccountId · toAccountId · amount · status · transferDate · notes · createdAt

## NotificationSettings *(new)*
id · userId · leadTimeDays · inAppEnabled · telegramEnabled · dailySendHour · createdAt · updatedAt

## TelegramLinks *(new)*
id · userId · telegramChatId · linkedAt · status

## NotificationLog *(new)*
id · expenseId · monthId · channel · sentAt · messagePreview

---

# 29. Business Rules

* Amounts (income and expense) cannot be negative.
* Expense name, category, and payment account are mandatory.
* Income must reference an account.
* Transfers must reference valid, distinct source and destination accounts.
* Deleting categories or referenced accounts requires reassignment.
* Deleting templates does not affect historical expenses.
* Disabled templates are not copied into new months.
* Historical months remain editable; edits immediately update reports.
* Account balances = Opening Balance + Income + Completed Transfers In − Completed Transfers Out − Paid Expenses.
* Pending expenses reduce projected, not current, balances. Skipped expenses are ignored in both.
* Transfer recommendations are advisory only until recorded as completed.
* **`dueDay` is resolved to an absolute `dueDate` at month-creation time using the clamp-to-last-day rule (Module 14); manual per-month overrides never change the template.**
* **Alerts are advisory only, deduplicated per expense/month/channel, and automatically suppressed once an expense is Paid or Skipped (Module 15).**

---

# 30. UI Requirements Summary

* Mobile-first responsive design (360px minimum) with progressive enhancement to tablet/desktop
* Sticky bottom nav (mobile) / left sidebar (desktop)
* Dark mode default, Light and System supported
* Inline editing, minimal clicks, keyboard-friendly on desktop
* Loading skeletons, toast notifications, confirmation dialogs, empty-state illustrations
* Search everywhere, sticky table headers, pagination where required
* One-tap Mark Paid, bottom-sheet editing on mobile
* In-app notification bell with unread badge (new)

---

# 31. Folder Structure

```text
app/
│
├── (auth)
│   └── login
│
├── dashboard
├── month
├── accounts
├── templates
├── categories
├── transfers
├── reports
├── settings
├── notifications        # new — in-app alert center
├── api
│   └── telegram
│       └── webhook      # new — Telegram bot webhook
│   └── cron
│       └── notifications # new — daily alert dispatch endpoint
│
components/
│
├── dashboard
├── charts
├── expenses
├── accounts
├── templates
├── categories
├── transfers
├── notifications         # new
├── common
│
lib/
│
├── auth
├── db
├── services
│   └── notifications      # new — alert composition, dedupe, Telegram send
├── validations
├── calculations
│
drizzle/
│
├── schema.ts
├── migrations
│
public/
```

---

# 32. Non-Functional Requirements

* Production-ready, strict TypeScript, modular architecture
* Clean separation of UI, business logic, persistence
* Server-side validation for all mutations; client-side validation for UX
* Graceful error handling; Telegram/alert failures never break core app flows
* No Redux or unnecessary global state libraries
* Prefer Server Actions over client-side data fetching
* Minimal dependencies; fast initial load
* Suitable for years of unattended personal use
* Secrets (JWT secret, Turso credentials, Telegram bot token) live only in server-side encrypted environment variables
* Login is rate-limited; sessions use a sensible sliding timeout (default 30 days)
* Recommend periodic Turso database export/backup (e.g. scheduled export to object storage or manual export reminder in Settings) given this is the sole source of truth for household finances with no other system of record

---

# 33. Out of Scope (v2.0)

* Receipt uploads / OCR
* Bank or UPI integrations, automatic transaction import
* Investment portfolio tracking, loan amortization schedules, tax planning
* AI-generated financial insights
* Multi-household support, more than two users
* Native mobile applications
* Full offline data editing (offline shell only)
* Multi-currency support
* Web Push (iOS Safari) as a notification channel — Telegram is the primary push channel for v2.0
* Configurable due-day clamping strategy (fixed clamp-to-last-day rule only, not user-adjustable, in this version)

---

# 34. Acceptance Criteria

The project is considered complete when, in addition to all v1.0 criteria:

1. The application is deployed on Vercel with Turso as the database and is fully usable on a 360px-wide mobile viewport with no horizontal scrolling.
2. Both predefined users can log in, stay in a session per the configured timeout, and are protected by login rate-limiting.
3. Bank accounts, categories, and expense templates — including the new Due Day field — are fully configurable from the UI.
4. Opening a new month auto-creates it, copying templates and resolving each fixed expense's `dueDay` into a correct `dueDate` for that month, including correct clamping in short months.
5. The Month screen lets users view the current month's fixed expenses ordered/grouped by due date ("date-wise").
6. Marking an expense Paid/Pending correctly updates balances, dashboards, reports, and suppresses/re-arms related alerts.
7. Manual transfers and the Transfer Planner function as in v1.0, and their recommendations are reflected inside alert message text.
8. Users can link a Telegram account from Settings, receive a correctly worded due-date + funding alert ahead of a fixed expense's due date, and disconnect Telegram at any time.
9. The daily notification job sends at most one alert per expense/month/channel, and failures for one user/expense do not block others.
10. In-app notification center displays past alerts with working unread badge and links back to the relevant expense.
11. CSV/Excel exports, historical month editing, and all v1.0 reporting continue to function unchanged.
12. The application supports dark/light/system themes, installs as a PWA, and delivers a polished, intuitive experience on both mobile and desktop.
13. The complete solution remains maintainable and operable indefinitely on the chosen free/low-cost hosting stack, with the daily cron job as the only scheduled process in the system.