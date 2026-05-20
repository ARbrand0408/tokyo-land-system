import { useEffect, useMemo, useState } from 'react';
import { listProperties } from '../api/properties';
import { ApiError } from '../api/client';
import type { Property, PropertyStatus } from '../api/types';
import { StatusBadge, type Tone } from '../components/StatusBadge';
import { formatDate, formatYen } from '../lib/format';

const statusTone: Record<PropertyStatus, Tone> = {
  公開中: 'emerald',
  商談中: 'terracotta',
  成約済: 'pine',
  非公開: 'muted',
  準備中: 'forest',
};

const statusOrder: PropertyStatus[] = ['公開中', '商談中', '準備中', '成約済', '非公開'];

export function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'すべて' | PropertyStatus>('すべて');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProperties()
      .then((res) => {
        if (!cancelled) setProperties(res.data);
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
    return properties.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'すべて' || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, properties]);

  const counts = useMemo(() => {
    const map: Record<PropertyStatus, number> = {
      公開中: 0,
      商談中: 0,
      成約済: 0,
      非公開: 0,
      準備中: 0,
    };
    properties.forEach((p) => {
      map[p.status] += 1;
    });
    return map;
  }, [properties]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] tracking-widest text-ink-muted">
          PROPERTY MASTER
        </span>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-ink-primary">物件マスタ</h1>
            <p className="text-sm text-ink-secondary mt-1">
              取扱中の物件 {loading ? '—' : properties.length} 件を一元管理します。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-md border border-ink-muted/30 text-ink-secondary text-xs hover:border-ink-primary hover:text-ink-primary transition-colors">
              CSVエクスポート
            </button>
            <button className="px-4 py-2 rounded-md bg-accent-terracotta text-bg-white text-xs font-medium hover:bg-accent-terracotta/90 transition-colors">
              + 物件を登録
            </button>
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

      <section className="grid grid-cols-5 gap-3">
        {statusOrder.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'すべて' : s)}
            className={[
              'text-left bg-bg-card rounded-lg p-4 border transition-all',
              statusFilter === s
                ? 'border-accent-pine/50 ring-1 ring-accent-pine/30'
                : 'border-ink-muted/10 hover:border-ink-muted/30',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">{s}</span>
              <StatusBadge label={`${counts[s]}件`} tone={statusTone[s]} />
            </div>
            <div className="font-serif text-2xl text-ink-primary mt-2">
              {loading ? '—' : counts[s]}
            </div>
          </button>
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
              placeholder="物件名・住所・物件コードで検索"
              className="w-full pl-9 pr-3 py-2.5 rounded-md bg-bg-white border border-ink-muted/20 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-pine/30 focus:border-accent-pine/40"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <span>並び替え:</span>
            <select className="bg-bg-white border border-ink-muted/20 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-pine/30">
              <option>更新日（新しい順）</option>
              <option>価格（高い順）</option>
              <option>価格（安い順）</option>
              <option>物件コード</option>
            </select>
          </div>
          {statusFilter !== 'すべて' && (
            <button
              onClick={() => setStatusFilter('すべて')}
              className="text-xs text-accent-terracotta hover:underline"
            >
              フィルタ解除 ({statusFilter})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-ink-muted uppercase tracking-wider bg-bg-base/30">
                <th className="px-5 py-3 font-medium">物件コード</th>
                <th className="px-5 py-3 font-medium">物件名 / 所在地</th>
                <th className="px-5 py-3 font-medium">種別</th>
                <th className="px-5 py-3 font-medium">価格</th>
                <th className="px-5 py-3 font-medium">専有面積</th>
                <th className="px-5 py-3 font-medium">間取り</th>
                <th className="px-5 py-3 font-medium">築年</th>
                <th className="px-5 py-3 font-medium">ステータス</th>
                <th className="px-5 py-3 font-medium">更新日</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-ink-muted">
                    読み込み中…
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-ink-muted/10 hover:bg-bg-base/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-ink-secondary">{p.code}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-primary">{p.name}</div>
                      <div className="text-[11px] text-ink-muted">{p.address}</div>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary text-xs">{p.type}</td>
                    <td className="px-5 py-4 font-mono text-ink-primary font-medium">
                      {formatYen(p.price)}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-secondary">
                      {p.sizeSqm.toFixed(1)}㎡
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">{p.rooms}</td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-secondary">
                      {p.builtYear ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={p.status} tone={statusTone[p.status]} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-secondary">
                      {formatDate(p.updatedAt)}
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-ink-muted">
                    該当する物件がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-ink-muted/10 flex items-center justify-between text-xs text-ink-muted">
          <span>
            {filtered.length} / {properties.length} 件を表示
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
