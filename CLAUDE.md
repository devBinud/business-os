# Business OS demo — notes for Claude

Source of truth for scope: `integroX_Product_Documentation.docx` (product concept + demo requirements).

## Stack
- React 19 + Vite, plain JavaScript (`.jsx`), react-router-dom 7, recharts, lucide-react.
- Styling: one global stylesheet `src/styles/global.css` with CSS tokens on `:root`. No Tailwind.
- Run: `npm run dev` (port 5173). Verify changes with `npm run build`.

## Rules from the product document
- Frontend demo only: sample data, simulated actions. Never imply real payments, emails or logins.
- Look and feel: calm, professional, restrained neutral palette, clear spacing. No decorative
  gradients, heavy animation or crowded screens. Keep motion subtle.
- Desktop-first, must stay usable on tablet and phone (no horizontal page scroll).
- Prefer a few complete, connected workflows over many unfinished screens.

## Conventions
- All state changes go through `actions` in `src/store/DemoStore.jsx` (they also log activity).
- Dates are local ISO strings `YYYY-MM-DD`; use helpers in `src/utils/date.js`.
- Invoice status/balances are derived (`src/utils/calc.js`), never stored.
- Access = role permissions (`src/utils/permissions.js`) ∩ enabled modules (`useAccess()`).
- Money is formatted with `money()` from `useStore()` (respects the business currency).
- Sample data lives in `src/data/sampleData.js`; keep it separate from UI components.
