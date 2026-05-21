import { useEffect, useMemo, useState } from 'react';
import { listProperties, deleteProperty, duplicateProperty, setPropertyStatus } from '../api/properties';
import { ApiError } from '../api/client';
import type { Property, PropertyStatus } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { formatRent } from '../lib/format';
import { PropertyEditor } from './PropertyEditor';

const TOKYO_23 = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区',
  '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区',
  '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区',
  '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区',
];

export function Properties() {
  const [view, setView] = useState<{ mode: 'list' } | { mode: 'edit'; id: string | null }>({
    mode: 'list',
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('すべて');
  const [statusFilter, setStatusFilter] = useState<'すべて' | PropertyStatus>('すべて');

  const refresh = () => {
    setLoading(true);
    setError(null);
    return listProperties()
      .then((res) => setProperties(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? `APIエラー: ${err.message}`
            : err instanceof Error
              ? `APIに接続できません: ${err.message}`
              : 'APIに接続できません';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q);
      const matchesArea = areaFilter === 'すべて' || p.area === areaFilter;
      const matchesStatus = statusFilter === 'すべて' || p.status === statusFilter;
      return matchesQuery && matchesArea && matchesStatus;
    });
  }, [query, areaFilter, statusFilter, properties]);

  if (view.mode === 'edit') {
    return (
      <PropertyEditor
        propertyId={view.id}
        onBack={() => {
          setView({ mode: 'list' });
          refresh();
        }}
      />
    );
  }

  const publishedCount = properties.filter((p) => p.status === '公開').length;

  const handleDuplicate = async (id: string) => {
    await duplicateProperty(id);
    refresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？`)) return;
    await deleteProperty(id);
    refresh();
  };

  const handleStatusToggle = async (p: Property) => {
    const next: PropertyStatus = p.status === '公開' ? '下書き' : '公開';
    await setPropertyStatus(p.id, next);
    refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] tracking-widest text-ink-muted">PROPERTY MASTER</span>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-ink-primary">物件マスター</h1>
            <p className="text-sm text-ink-secondary mt-1">
              登録総数 {properties.length} 件 / 公開中 {publishedCount} 件
            </p>
          </div>
          <button
            onClick={() => setView({ mode: 'edit', id: null })}
            className="px-4 py-2 rounded-md bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90 transition-colors"
          >
            + 新規物件登録
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-4 py-3 text-sm text-accent-terracotta">
          {error}
        </div>
      )}

      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-ink-muted/10 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="物件名・住所で検索"
              className="w-full pl-9 pr-3 py-2.5 rounded-md bg-bg-white border border-ink-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30 focus:border-accent-pine/40"
            />
          </div>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
          >
            <option value="すべて">エリア(すべて)</option>
            {TOKYO_23.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-bg-base/60 rounded-md p-1">
            {(['すべて', '公開', '下書き'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={[
                  'px-3 py-1.5 rounded text-xs transition-colors',
                  statusFilter === s
                    ? 'bg-bg-white text-ink-primary shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          {loading && (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">読み込み中…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">
              該当する物件がありません
            </div>
          )}
          {!loading && filtered.map((p) => (
            <div
              key={p.id}
              className="px-5 py-4 border-t border-ink-muted/10 first:border-t-0 flex items-center gap-4 hover:bg-bg-base/30 transition-colors"
            >
              <div className="w-20 h-16 rounded bg-bg-base/60 flex items-center justify-center overflow-hidden shrink-0">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-ink-muted text-[10px]">no image</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  onClick={() => setView({ mode: 'edit', id: p.id })}
                  className="font-medium text-ink-primary truncate cursor-pointer hover:text-accent-pine"
                >
                  {p.name}
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5 truncate">
                  {p.area} / {p.rooms ?? '間取り未設定'} / {p.sizeSqm ? `${p.sizeSqm.toFixed(1)}㎡` : '—'} /{' '}
                  {p.propertyType.startsWith('賃貸') ? formatRent(p.rent) : formatRent(p.rent)}
                </div>
              </div>
              <button
                onClick={() => handleStatusToggle(p)}
                title="クリックでステータス切替"
              >
                <StatusBadge
                  label={p.status}
                  tone={p.status === '公開' ? 'emerald' : 'muted'}
                />
              </button>
              <div className="flex items-center gap-1">
                <ActionButton onClick={() => handleDuplicate(p.id)} label="複製" />
                <ActionButton
                  onClick={() => setView({ mode: 'edit', id: p.id })}
                  label="編集"
                  primary
                />
                <ActionButton
                  onClick={() => handleDelete(p.id, p.name)}
                  label="削除"
                  danger
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  primary,
  danger,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  const cls = primary
    ? 'border-accent-pine/40 text-accent-pine hover:bg-accent-pine/10'
    : danger
      ? 'border-accent-terracotta/40 text-accent-terracotta hover:bg-accent-terracotta/10'
      : 'border-ink-muted/30 text-ink-secondary hover:text-ink-primary hover:border-ink-muted/60';
  return (
    <button onClick={onClick} className={`px-2.5 py-1 rounded border text-[11px] ${cls}`}>
      {label}
    </button>
  );
}
