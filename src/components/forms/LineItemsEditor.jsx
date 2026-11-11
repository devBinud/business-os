import { Plus, Trash2 } from 'lucide-react';
import { lineTotal } from '../../utils/calc.js';
import { uid } from '../../utils/format.js';

export const COMMON_ITEMS = [
  ['Standard room · night', 120],
  ['Deluxe room · night', 185],
  ['Suite · night', 320],
  ['Breakfast · per guest', 18],
  ['Conference hall · day', 650],
  ['Catering package · per guest', 32],
  ['Airport transfer', 45],
  ['Laundry service', 15],
];

export const newLine = () => ({ id: uid('li'), description: '', qty: 1, price: '' });

/** Editable table of line items. items: [{ id, description, qty, price }] */
export default function LineItemsEditor({ items, onChange, money, error }) {
  const update = (id, field, value) =>
    onChange(
      items.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, [field]: value };
        // Auto-fill price when a known item is chosen and price is empty.
        if (field === 'description' && (it.price === '' || it.price === undefined)) {
          const known = COMMON_ITEMS.find(([d]) => d === value);
          if (known) next.price = known[1];
        }
        return next;
      }),
    );

  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table className="table line-items">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 90 }}>Qty</th>
              <th style={{ width: 130 }}>Unit price</th>
              <th className="num" style={{ width: 120 }}>Amount</th>
              <th style={{ width: 44 }}><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td>
                  <input
                    className="input"
                    list="common-items"
                    value={it.description}
                    onChange={(e) => update(it.id, 'description', e.target.value)}
                    placeholder="Item or service"
                    aria-label={`Line ${i + 1} description`}
                    style={{ minWidth: 180 }}
                  />
                </td>
                <td>
                  <input className="input" type="number" min="0" step="1" value={it.qty} onChange={(e) => update(it.id, 'qty', e.target.value)} aria-label={`Line ${i + 1} quantity`} />
                </td>
                <td>
                  <input className="input" type="number" min="0" step="0.01" value={it.price} onChange={(e) => update(it.id, 'price', e.target.value)} aria-label={`Line ${i + 1} unit price`} />
                </td>
                <td className="num nowrap">{money(lineTotal(it))}</td>
                <td>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                    disabled={items.length === 1}
                    aria-label={`Remove line ${i + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id="common-items">
        {COMMON_ITEMS.map(([d]) => <option key={d} value={d} />)}
      </datalist>
      {error && <span className="small text-danger" role="alert">{error}</span>}
      <div>
        <button type="button" className="btn sm" onClick={() => onChange([...items, newLine()])}>
          <Plus size={14} /> Add line
        </button>
      </div>
    </div>
  );
}

export function validateLines(items) {
  const filled = items.filter((it) => String(it.description).trim());
  if (filled.length === 0) return 'Add at least one line item';
  if (filled.some((it) => !(Number(it.qty) > 0))) return 'Each line needs a quantity greater than 0';
  if (filled.some((it) => it.price === '' || Number(it.price) < 0)) return 'Each line needs a unit price';
  return null;
}

export function cleanLines(items) {
  return items
    .filter((it) => String(it.description).trim())
    .map((it) => ({ ...it, description: it.description.trim(), qty: Number(it.qty), price: Number(it.price) }));
}
