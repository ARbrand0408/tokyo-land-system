import { useEffect, useMemo, useState } from 'react';
import { createCustomer, listCustomers } from '../../api/customers';
import { ApiError } from '../../api/client';
import type { CustomerListItem } from '../../api/types';
import { CustomerForm } from './CustomerForm';

type Props = {
  onSelect: (id: string) => void;
};

export function CustomersList({ onSelect }: Props) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = () => {
    setLoading(true);
    return listCustomers()
      .then((res) => setCustomers(res.data))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : '読み込み失敗');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.companyName ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    );
  }, [query, customers]);

  const totalProposals = customers.reduce((acc, c) => acc + c.proposalCount, 0);
  const followCount = customers.filter((c) => c.sentCount > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-6">
        <div>
          <span className="font-mono text-[11px] tracking-widest text-ink-muted">CUSTOMERS</span>
          <h1 className="font-serif text-3xl text-ink-primary mt-1">顧客・提案管理</h1>
          <p className="text-sm text-ink-secondary mt-1">
            顧客 {customers.length} 名 / 追客中 {followCount} 名 / 提案 {totalProposals} 件
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 rounded-md bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90"
        >
          + 新規顧客追加
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-4 py-3 text-sm text-accent-terracotta">
          {error}
        </div>
      )}

      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-5">
        <div className="relative max-w-md mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前 / 会社名 / メールで検索"
            className="w-full pl-9 pr-3 py-2.5 rounded-md bg-bg-white border border-ink-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
          />
        </div>

        {loading && <div className="py-12 text-center text-sm text-ink-muted">読み込み中…</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-muted">
            該当する顧客がいません
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="text-left bg-bg-white rounded-lg border border-ink-muted/15 p-4 hover:border-accent-pine/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-primary truncate">{c.name}</div>
                  {c.companyName && (
                    <div className="text-[11px] text-ink-muted mt-0.5 truncate">{c.companyName}</div>
                  )}
                </div>
                <span className="font-mono text-[10px] text-accent-pine bg-accent-pine/10 px-2 py-0.5 rounded tracking-widest">
                  {c.accessCode}
                </span>
              </div>
              <div className="mt-3 text-[11px] text-ink-secondary space-y-0.5">
                <div className="font-mono">{c.email ?? '—'}</div>
                <div className="font-mono">{c.phone ?? '—'}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-ink-muted/10 flex items-center justify-between text-[11px] text-ink-muted">
                <span>提案 {c.proposalCount}件</span>
                <span>送信済み {c.sentCount}件</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {adding && (
        <CustomerForm
          onCancel={() => setAdding(false)}
          onSubmit={async (input) => {
            const res = await createCustomer(input);
            setAdding(false);
            await refresh();
            onSelect(res.data.id);
          }}
        />
      )}
    </div>
  );
}
