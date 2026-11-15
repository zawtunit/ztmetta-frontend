# Chanmyay donor register and TV display

React/Vite application in the existing Ztmetta repository. Dashboard: `/chanmyay`; public TV: `/chanmyay/tv`.

## Current deployment state

The event-title feature works in the browser preview. The shared database integration and migration are implemented and tested locally, but no Supabase project or administrator has been provisioned yet. `src/chanmyay/cloud-config.js` intentionally contains empty public connection details. Until configured, the app explicitly says it saves records in the current browser only. Do not treat preview records as shared or backed up.

## Workflow

- Add or edit single-day and inclusive date-range offerings. New entries default to Approved.
- Breakfast, Lunch, Water/Drink, Rental/Electric; legacy Water and Drinks records combine on read.
- Desktop daily columns and phone daily cards, newest dates first, up to 30 dates per page.
- Multiple donors per category. Cancelled/Pending records stay off the TV.
- Event name / TV heading in the dashboard replaces the Myanmar donor heading. Clear and save to restore the standard heading. This is one centre-wide title, including when viewing another date.
- Date selector and Today reset on the TV. A `?date=YYYY-MM-DD` link pins a date; without it the display follows Singapore time.
- Four TV rows, up to two donors per category per page, rotating every 12 seconds. Categories with no approved donor display “ချမ်းမြေ့အဖွဲ့ဝင်များ အလှူ”. A later rotation page for a category that already has donors displays a dash rather than claiming there are none.
- Lotus/Bodhi background, larger centre heading, clean full-screen/presentation mode and Show controls at the bottom.
- CSV export and planned sections for event, Yogi, visitor and finance modules.

## Connect the shared database

1. Connect the user's Supabase account and select or create a dedicated project after checking its billing plan. Prefer Singapore region when creating the project.
2. Apply `supabase/migrations/20261116000100_chanmyay_shared.sql` once through an authenticated migration tool. Never apply test fixture data to production.
3. Ask which email should own the sole administrator account. Create/invite that Supabase Auth user through the service dashboard or admin API. The user sets their password themselves. Disable open self-registration. Do not use a public sign-up page or let the first visitor claim administrator access.
4. With privileged database access, insert the verified Auth user's UUID into `public.cm_administrators(user_id)`. Its singleton key permits exactly one administrator. No client role can modify this table.
5. Fill in `cloud-config.js` with the chosen project's public URL and **publishable/anon key only**, or set the two `VITE_SUPABASE_*` variables listed in `.env.example`. These connection values are public; authorization is enforced in Postgres. Never put a service-role key, database password, admin password or JWT signing secret in source/client assets.
6. Publish to the existing `feature/chanmyay-donor-preview` Vercel deployment. The configured dashboard requires the administrator's login. The TV makes only the public display RPC, even when opened by the administrator.
7. On the browser holding existing offerings, log in and use Review browser records. Review and explicitly confirm import. Import runs in one database transaction and skips existing IDs; it never overwrites matching records or deletes the browser copy. Do this separately on each browser origin containing records, since old immutable Vercel deployment URLs have separate local storage.
8. Verify from a second device: saved offerings and event name appear within 20 seconds; anonymous users cannot read phone details or change anything. Log out and confirm administrator records disappear from the dashboard.
9. Set a permanent hostname before adding the WordPress `/donor/` redirect or configuring TV autostart. DNS, WordPress redirect and kiosk auto-start are not configured by this source change.

## Access and reliability

The TV RPC returns only approved names, dedications, dates, categories and the centre event title. It never returns phone numbers, administrator details or audit history. Anonymous users cannot select the underlying tables. Other authenticated accounts cannot read private records or write anything. Only the one administrator can save offerings/settings or import records.

All writes go through guarded RPCs; version checks reject stale edits. Changes append a private audit record. The app refreshes shared data every 20 seconds and on returning to a tab. Network failures show an error instead of silently switching to device-local writes or claiming that no donors exist. Database backup/restore schedules have not been configured; audit history is not a backup. Keep CSV exports until operational backup and recovery have been verified.

## Development and validation

```sh
npm ci
npm run dev
npm run test:shared
npm run build
```

`test:shared` uses an ephemeral PostgreSQL-compatible PGlite database, with test-only Auth role fixtures, and applies the real migration. It verifies the singleton administrator, denied anonymous and other-user access, public phone exclusion, approval and inclusive-date filters, event title, stale-edit rejection, validation, import idempotency and private change history. It does not prove that a hosted Supabase project is configured; verify that separately after connection.

Browser checks covered the editable Myanmar event title, persistence after navigation, and offering saves after the async data layer change. Existing donor workflow/layout and TV controls remain in place.
