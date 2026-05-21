import { useEffect, useState } from 'react';
import { listCustomers } from '../api/customers';
import { listProperties } from '../api/properties';
import { listRecentProposals } from '../api/proposals';
import { ApiError } from '../api/client';
import type { CustomerListItem, Property, Proposal } from '../api/types';
import { StatusBadge, type Tone } from '../components/StatusBadge';
import { relativeTime } from '../lib/format';

type DashboardProps = {
  onJumpToCustomers: () => void;
};

export function Dashboard({ onJumpToCustomers }: DashboardProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [recent, setRecent] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listCustomers(), listProperties(), listRecentProposals(5)])
      .then(([c, p, r]) => {
        if (cancelled) return;
        setCustomers(c.data);
        setProperties(p.data);
        setRecent(r.data);
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

  const publishedCount = properties.filter((p) => p.status === '公開').length;
  // 追客中 = 送信済みの提案を持っているが、未契約 (このシステムでは契約管理外なので送信済みの提案がある顧客を追客中とみなす)
  const followCount = customers.filter((c) => c.sentCount > 0).length;

  const stats = [
    { label: '登録物件数', value: publishedCount, hint: `公開中 / 全${properties.length}件` },
    { label: '顧客数', value: customers.length, hint: '登録済み顧客' },
    { label: '追客中', value: followCount, hint: '提案送信済み' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] tracking-widest text-ink-muted">DASHBOARD</span>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-ink-primary">ダッシュボード</h1>
            <p className="text-sm text-ink-secondary mt-1">
              本日の業務状況。最近の提案と主要KPIを確認できます。
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-ink-muted">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}
            </div>
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

      <section className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-bg-card rounded-lg p-6 border border-ink-muted/10 shadow-sm"
          >
            <div className="text-xs text-ink-muted">{s.label}</div>
            <div className="font-serif text-4xl text-ink-primary mt-3">
              {loading ? '—' : s.value}
            </div>
            <div className="text-[11px] text-ink-muted mt-2">{s.hint}</div>
          </div>
        ))}
      </section>

      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-ink-muted/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-ink-primary">最近の提案</h2>
            <p className="text-[11px] text-ink-muted mt-1">最新5件を表示します</p>
          </div>
          <button
            onClick={onJumpToCustomers}
            className="text-xs text-accent-pine hover:underline"
          >
            すべて見る →
          </button>
        </div>

        <div>
          {loading && (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">読み込み中…</div>
          )}
          {!loading && recent.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">
              まだ提案がありません
            </div>
          )}
          {!loading &&
            recent.map((p) => (
              <div
                key={p.id}
                onClick={onJumpToCustomers}
                className="px-5 py-4 border-t border-ink-muted/10 flex items-center gap-4 hover:bg-bg-base/30 cursor-pointer transition-colors first:border-t-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink-primary truncate">
                    {p.title ?? '（タイトルなし）'}
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    {p.customer.name} 様 / {relativeTime(p.updatedAt)}
                  </div>
                </div>
                <StatusBadge
                  label={p.status}
                  tone={p.status === '送信済み' ? 'emerald' : ('muted' as Tone)}
                />
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
