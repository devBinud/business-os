import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Package, TriangleAlert, PackagePlus, PackageMinus, Pencil, History, Wallet } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, SearchInput, StatusBadge, Segmented, Modal, Field, ClearButton, StatCard } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required, nonNegativeInt } from '../utils/validation.js';
import { isLowStock } from '../utils/calc.js';
import { formatDate } from '../utils/date.js';

function ProductForm({ open, onClose, product }) {
  const { actions, products } = useStore();
  const toast = useToast();
  const blank = { name: '', category: '', supplier: '', stock: 0, reorderLevel: 10, unitCost: '' };
  const form = useForm(blank, {
    name: [required('Enter a product name')],
    category: [required('Enter a category')],
    stock: [nonNegativeInt()],
    reorderLevel: [nonNegativeInt()],
    unitCost: [[(v) => v === '' || Number(v) >= 0, 'Enter a valid cost']],
  });
  useEffect(() => {
    if (open) form.reset(product ? { ...product } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const categories = [...new Set(products.map((p) => p.category))].sort();

  const save = () =>
    form.submit((v) => {
      actions.saveProduct({ ...(product || {}), ...v, name: v.name.trim(), stock: Number(v.stock), reorderLevel: Number(v.reorderLevel), unitCost: Number(v.unitCost) || 0 });
      toast(product ? 'Product updated' : 'Product added');
      onClose();
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'Add product'}
      onSubmit={save}
      footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="submit" className="btn primary">{product ? 'Save changes' : 'Add product'}</button></>}
    >
      <div className="form-grid">
        <Field label="Product name" error={form.errors.name} className="full">{(id) => <input id={id} {...form.bind('name')} />}</Field>
        <Field label="Category" error={form.errors.category}>
          {(id) => (<><input id={id} list="product-categories" {...form.bind('category')} /><datalist id="product-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist></>)}
        </Field>
        <Field label="Supplier">{(id) => <input id={id} {...form.bind('supplier')} />}</Field>
        <Field label={product ? 'Current stock' : 'Opening stock'} error={form.errors.stock} hint={product ? 'Use “Adjust stock” to keep a movement history.' : undefined}>
          {(id) => <input id={id} type="number" min="0" step="1" {...form.bind('stock')} disabled={Boolean(product)} />}
        </Field>
        <Field label="Low-stock threshold" error={form.errors.reorderLevel}>{(id) => <input id={id} type="number" min="0" step="1" {...form.bind('reorderLevel')} />}</Field>
        <Field label="Unit cost" error={form.errors.unitCost}>{(id) => <input id={id} type="number" min="0" step="0.01" {...form.bind('unitCost')} />}</Field>
      </div>
    </Modal>
  );
}

function AdjustStockForm({ product, onClose }) {
  const { actions } = useStore();
  const toast = useToast();
  const form = useForm(
    { type: 'out', qty: 1, reason: '' },
    {
      qty: [[(v) => Number.isInteger(Number(v)) && Number(v) > 0, 'Enter a whole number greater than 0']],
      reason: [required('Add a short reason')],
    },
  );
  const v = form.values;
  const after = product.stock + (v.type === 'in' ? 1 : -1) * (Number(v.qty) || 0);

  const save = () =>
    form.submit((values) => {
      if (values.type === 'out' && Number(values.qty) > product.stock) {
        form.setValue('qty', product.stock);
        return;
      }
      actions.adjustStock(product.id, values);
      toast(`Stock updated: ${product.name}`);
      onClose();
    });

  return (
    <Modal
      open
      onClose={onClose}
      size="narrow"
      title="Adjust stock"
      description={`${product.name} · ${product.stock} in stock`}
      onSubmit={save}
      footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="submit" className="btn primary">Save adjustment</button></>}
    >
      <div className="stack">
        <Segmented
          label="Movement type"
          value={v.type}
          onChange={(t) => form.setValue('type', t)}
          options={[{ id: 'out', label: 'Stock out', icon: PackageMinus }, { id: 'in', label: 'Stock in', icon: PackagePlus }]}
        />
        <Field label="Quantity" error={form.errors.qty || (v.type === 'out' && Number(v.qty) > product.stock ? `Only ${product.stock} in stock` : undefined)}>
          {(id) => <input id={id} type="number" min="1" step="1" {...form.bind('qty')} />}
        </Field>
        <Field label="Reason" error={form.errors.reason}>
          {(id) => <input id={id} {...form.bind('reason')} placeholder={v.type === 'in' ? 'e.g. Delivery from supplier' : 'e.g. Issued to housekeeping'} />}
        </Field>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Stock after adjustment</span>
          <strong className={after <= product.reorderLevel ? 'text-danger' : ''}>{Math.max(after, 0)}</strong>
        </div>
      </div>
    </Modal>
  );
}

export default function Inventory() {
  const { products, stockMovements, money } = useStore();
  const { productById, employeeById } = useLookups();
  const access = useAccess();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState(params.get('filter') === 'low' ? 'low' : 'all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const canEdit = access.canEdit('inventory');

  const categories = [...new Set(products.map((p) => p.category))].sort();
  const low = products.filter(isLowStock);
  const stockValue = products.reduce((s, p) => s + p.stock * p.unitCost, 0);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => !category || p.category === category)
      .filter((p) => stockFilter === 'all' || isLowStock(p))
      .filter((p) => !term || `${p.name} ${p.sku} ${p.supplier}`.toLowerCase().includes(term))
      .map((p) => ({ ...p, value: p.stock * p.unitCost, state: p.stock === 0 ? 'out' : isLowStock(p) ? 'low' : 'ok' }));
  }, [products, q, category, stockFilter]);

  const columns = [
    { key: 'name', header: 'Product', render: (p) => (<div><div className="strong">{p.name}</div><div className="small muted">{p.sku} · {p.category}</div></div>) },
    { key: 'supplier', header: 'Supplier', render: (p) => <span className="muted">{p.supplier || '—'}</span> },
    {
      key: 'stock', header: 'In stock', align: 'right',
      render: (p) => (
        <div>
          <div className={`strong ${p.state !== 'ok' ? 'text-danger' : ''}`}>{p.stock}</div>
          <div className="small muted">min {p.reorderLevel}</div>
        </div>
      ),
    },
    { key: 'state', header: 'Status', sortValue: (p) => ({ out: 0, low: 1, ok: 2 })[p.state], render: (p) => <StatusBadge kind="stock" status={p.state} /> },
    ...(access.financials
      ? [
          { key: 'unitCost', header: 'Unit cost', align: 'right', render: (p) => money(p.unitCost) },
          { key: 'value', header: 'Stock value', align: 'right', render: (p) => money(p.value) },
        ]
      : []),
    ...(canEdit
      ? [{
          key: 'actions', header: '', sortable: false,
          render: (p) => (
            <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
              <button className="btn sm" onClick={() => setAdjusting(p)}>Adjust</button>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => { setEditing(p); setFormOpen(true); }} aria-label={`Edit ${p.name}`}><Pencil size={14} /></button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Products, stock levels, suppliers and stock movements."
        actions={canEdit && <button className="btn primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> Add product</button>}
      />
      <div className="stack">
        <div className={`grid ${access.financials ? 'grid-3' : 'grid-2'}`}>
          <StatCard icon={Package} label="Products tracked" value={products.length} meta={<span>{categories.length} categories</span>} />
          <StatCard icon={TriangleAlert} label="Low or out of stock" value={<span className={low.length ? 'text-danger' : ''}>{low.length}</span>} meta={<span>At or below threshold</span>} />
          {access.financials && <StatCard icon={Wallet} label="Stock value" value={money(stockValue)} meta={<span>At unit cost</span>} />}
        </div>

        <div className="grid grid-main-side" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="toolbar">
              <SearchInput className="search" value={q} onChange={setQ} placeholder="Search product, SKU or supplier" />
              <select className="select sm" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <Segmented label="Stock level" value={stockFilter} onChange={setStockFilter} options={[{ id: 'all', label: 'All' }, { id: 'low', label: 'Low stock', count: low.length }]} />
              {(q || category || stockFilter !== 'all') && <ClearButton onClick={() => { setQ(''); setCategory(''); setStockFilter('all'); }} />}
            </div>
            <DataTable columns={columns} rows={rows} initialSort={{ key: 'state', dir: 'asc' }} pageSize={12} />
          </div>

          <Card title="Recent stock movements" actions={<History size={16} className="faint" />} flush>
            {stockMovements.length === 0 ? (
              <div className="muted small" style={{ padding: '0 20px 20px' }}>No movements yet.</div>
            ) : (
              <ul className="list">
                {stockMovements.slice(0, 10).map((m) => (
                  <li key={m.id} className="list-item">
                    <span className="feed-icon" style={m.type === 'in' ? { background: 'var(--success-bg)', color: 'var(--success)' } : undefined}>
                      {m.type === 'in' ? <PackagePlus size={15} /> : <PackageMinus size={15} />}
                    </span>
                    <span className="grow">
                      <div><strong>{m.type === 'in' ? '+' : '−'}{m.qty}</strong> {productById[m.productId]?.name ?? 'Deleted product'}</div>
                      <div className="sub">{m.reason} · {employeeById[m.by]?.name ?? 'Team'} · {formatDate(m.date)}</div>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ProductForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} product={editing} />
      {adjusting && <AdjustStockForm product={adjusting} onClose={() => setAdjusting(null)} />}
    </>
  );
}
