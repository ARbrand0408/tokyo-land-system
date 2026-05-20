import { useEffect, useMemo, useState } from 'react';
import { listCustomers } from '../api/customers';
import type { Customer, CustomerStatus } from '../api/types';
import { ApiError } from '../api/client';
import { StatusBadge, type Tone } from '../components/StatusBadge';
import { formatBudgetRange, formatDate } from '../lib/format';

const statusTone: Record<CustomerStatus, Tone> = {
  商談中: 'terracotta',
  内見予定: 'forest',
  契約準備: 'pine',
  成約: 'emerald',
  保留: 'muted',
};

const filters: Array<CustomerStatus | 'すべて'> = [
  'すべて',
  '商談中',
  '内見予定',
  '契約準備',
  '成約',
  '保留',
];

function summarize(list: Customer[]) {
  const counts = list.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});
  return [
    { label: '担当顧客', value: list.length, hint: '対応中の顧客総数' },
    { label: '商談中', value: counts['商談中'] ?? 0, hint: '一次〜二次交渉' },
    { label: '内見予定', value: counts['内見予定'] ?? 0, hint: '今週の予定' },
    { label: '成約', value: counts['成約'] ?? 0, hint: '今期累計' },
  ];
}

export function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('すべて');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCustomers()
      .then((res) => {
        if (!cancelled) setCustomers(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? `APIエラー: ${err.message}`
            : err instanceof Error
              ? `APIに接続できません: ${err.message}`
              : 'APIに接続できません';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.nameKana.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.desiredArea ?? '').toLowerCase().includes(q);
      const matchesFilter = filter === 'すべて' || c.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [query, filter, customers]);

  const stats = summarize(customers);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] tracking-widest text-ink-muted">DASHBOARD</span>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-ink-primary">担当者ダッシュボード</h1>
            <p className="text-sm text-ink-secondary mt-1">
              山田 雅人さん、こんにちは。本日は{loading ? '…' : `${filtered.length}件`}
              の顧客が表示されています。
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-ink-muted">2026.05.20 / WED</div>
            <div className="text-xs text-ink-secondary mt-1">
              {loading ? '同期中…' : `最終同期 ${new Date().toLocaleTimeString('ja-JP')}`}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-4 py-3 text-sm text-accent-terracotta">
          {error}
          <div className="text-[11px] text-ink-muted mt-1">
            backend が起動しているか確認してください: cd backend && npm run dev
          </div>
        </div>
      )}

      <section className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-bg-card rounded-lg p-5 border border-ink-muted/10 shadow-sm"
          >
            <div className="text-xs text-ink-muted">{s.label}</div>
            <div className="font-serif text-3xl text-ink-primary mt-2">
              {loading ? '—' : s.value}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">{s.hint}</div>
          </div>
        ))}
      </section>

      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-ink-muted/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="顧客名・カナ・顧客コード・エリアで検索"
              className="w-full pl-9 pr-3 py-2.5 rounded-md bg-bg-white border border-ink-muted/20 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-pine/30 focus:border-accent-pine/40"
            />
          </div>
          <div className="flex items-center gap-1 bg-bg-base/60 rounded-md p-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded text-xs transition-colors',
                  filter === f
                    ? 'bg-bg-white text-ink-primary shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="ml-auto px-4 py-2 rounded-md bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90 transition-colors">
            + 新規顧客
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-ink-muted uppercase tracking-wider bg-bg-base/30">
                <th className="px-5 py-3 font-medium">顧客コード</th>
                <th className="px-5 py-3 font-medium">氏名</th>
                <th className="px-5 py-3 font-medium">連絡先</th>
                <th className="px-5 py-3 font-medium">担当</th>
                <th className="px-5 py-3 font-medium">希望エリア</th>
                <th className="px-5 py-3 font-medium">予算</th>
                <th className="px-5 py-3 font-medium">ステータス</th>
                <th className="px-5 py-3 font-medium">最終接触</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-ink-muted">
                    読み込み中…
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-ink-muted/10 hover:bg-bg-base/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-ink-secondary">{c.code}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-primary">{c.name}</div>
                      <div className="text-[11px] text-ink-muted">{c.nameKana}</div>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">
                      <div className="font-mono text-xs">{c.phone ?? '—'}</div>
                      <div className="text-[11px] text-ink-muted">{c.email ?? '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">{c.assignedTo}</td>
                    <td className="px-5 py-4 text-ink-secondary">{c.desiredArea ?? '—'}</td>
                    <td className="px-5 py-4 font-mono text-ink-primary">
                      {formatBudgetRange(c.budgetMin, c.budgetMax)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={c.status} tone={statusTone[c.status]} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-secondary">
                      {formatDate(c.lastContactedAt)}
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-ink-muted">
                    該当する顧客がいません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-ink-muted/10 flex items-center justify-between text-xs text-ink-muted">
          <span>
            {filtered.length} / {customers.length} 件を表示
          </span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 hover:text-ink-primary">‹ 前へ</button>
            <span className="font-mono">1 / 1</span>
            <button className="px-2 py-1 hover:text-ink-primary">次へ ›</button>
          </div>
        </div>
      </section>
    </div>
  );
}
