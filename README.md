# Business OS — React.js demo

Interactive frontend demo of **Business OS**, a central workspace for business operations
(see `integroX_Product_Documentation.docx`). All data is sample data stored in the browser.

## Run it

```bash
npm install
npm run dev        # opens http://localhost:5173
npm run build      # production build into dist/
```

## Try the demo

1. On the sign-in page, pick a role (Owner, Manager, Accountant, Staff) or sign in with a sample
   staff email such as `priya@summitview.example` (any password).
2. The owner is taken through **Business setup** once (or can skip it).
3. Connected workflow: **Customers → Add customer → Create invoice → Record payment**, then open
   the **Dashboard** and see revenue and outstanding payments update.
4. Switch roles from the profile menu (top right) to see navigation and access change.
5. **Settings → Demo data → Reset** restores the original sample data.

## Project structure

| Folder | Contents |
| --- | --- |
| `src/pages` | One file per screen (dashboard, customers, sales, invoices, expenses, employees, tasks, bookings, inventory, reports, settings, sign-in, setup) |
| `src/components` | Reusable UI (`ui.jsx`), `DataTable`, charts, toasts and forms |
| `src/layouts` | App shell, sidebar, top bar, global search, notifications, user menu |
| `src/data` | Sample business data and module definitions |
| `src/store` | Shared demo state (`DemoStore.jsx`) and role/module access (`useAccess.js`) |
| `src/utils` | Dates, money formatting, invoice calculations, permissions, validation |
| `src/styles` | Global styles and design tokens |

## Not included (by design)

Real authentication, a database, payment processing, real notifications, accounting/payroll,
and AI analysis. These need backend services — see section 10 of the product document.
