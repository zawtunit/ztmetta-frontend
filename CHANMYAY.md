# Chanmyay donor workflow preview

This first release adds a centre management section to the existing Ztmetta React application.

## Run on your computer

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, then append `/chanmyay` for the dashboard or `/chanmyay/tv` for the TV view. Use `npm run build` to create the Vercel-ready production build. Existing Vercel rewrites support these paths.

## Included

- Empty donor register with add/edit, search, status and date filters, and CSV export.
- Breakfast, lunch, drinking water and drinks, with multiple categories per offering.
- A single offering date or an inclusive date range.
- Pending, Approved and Cancelled states. Public submissions and real authentication are not implemented.
- Myanmar/English donor names and optional dedications.
- Phone kept off the TV output.
- Singapore date selection, including midnight rollover.
- A four-row Myanmar/English TV table with a generated lotus-pond background. Each category shows up to two donors per page, with additional pages rotating every 12 seconds. Decorative Dhamma wheels are used beside the heading pending the original centre logo.
- TV updates when another tab in the same browser changes an offering.
- Clearly labelled planned sections for event, Yogi, visitor and finance modules.

## Current limits

Records are saved in this browser's local storage. They are not shared across computers or TVs, and clearing browser data removes them. CSV exports provide a readable copy. This preview has no production staff access control, payment collection, shared database, receipt processing or accounting. It is for evaluating the workflow with sample data.

The proposed custom hostname `chanmyay.ztmetta.com` has not been connected. A dedicated deployment can later use that hostname with a shared backend and staff authentication. This archive does not contain live donor data or test records.

## Next implementation stage

Connect a shared API and database, staff authentication and permissions, a change history and backup/restore. Public donor submissions should default to Pending in the server, while only authorised staff can change approval. The TV API should return only approved names, categories, offering dates and dedications. Then build the other registration modules and the cashbook, linking donation payments to offering bookings.

## Verification

Production build passed. Browser checks covered adding/editing an offering, date-range persistence after reload, approval changes updating a second TV tab, and exclusion of phone details from the TV. Logic checks covered Singapore midnight, invalid and reversed dates, inclusive ranges, pending/cancelled filtering, pagination and CSV formula escaping.
