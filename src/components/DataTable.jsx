import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './ui.jsx';

/**
 * Consistent sortable, paginated table.
 * columns: [{ key, header, render?(row), sortValue?(row), align?: 'right', width?, className? }]
 */
export default function DataTable({
  columns,
  rows,
  onRowClick,
  initialSort,
  pageSize = 10,
  empty = { title: 'No records found', text: 'Try changing your search or filters.' },
  footer,
  rowKey = (r) => r.id,
}) {
  const [sort, setSort] = useState(initialSort ?? null); // { key, dir: 'asc' | 'desc' }
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const get = col.sortValue ?? ((r) => r[col.key]);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va === vb) return 0;
      if (va === undefined || va === null) return 1;
      if (vb === undefined || vb === null) return -1;
      return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * dir;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key) => {
    setPage(0);
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  if (rows.length === 0) {
    return <EmptyState title={empty.title}>{empty.text}</EmptyState>;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => {
                const sortable = c.sortable !== false && c.header;
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={`${sortable ? 'sortable' : ''} ${c.align === 'right' ? 'num' : ''}`}
                    style={{ width: c.width }}
                    onClick={sortable ? () => toggleSort(c.key) : undefined}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="sort">
                      {c.header}
                      {active && (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? 'clickable' : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && e.target === e.currentTarget && onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align === 'right' ? 'num' : ''} ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      <div className="table-foot">
        <span>
          Showing {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} of {sorted.length}
        </span>
        {pageCount > 1 && (
          <div className="row">
            <button className="btn sm icon" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {current + 1} of {pageCount}
            </span>
            <button className="btn sm icon" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
