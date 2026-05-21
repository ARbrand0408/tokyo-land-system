import { useEffect, useMemo, useState } from 'react';
import { listProperties } from '../../api/properties';
import type { Property } from '../../api/types';
import { formatRent } from '../../lib/format';

type Props = {
  open: boolean;
  initiallySelected: string[];
  onClose: () => void;
  onConfirm: (propertyIds: string[]) => void;
};

// 物件ピッカーモーダル
// - 顧客詳細画面から提案編集ビューに遷移せずに開ける
// - 公開中物件のみ表示
// - 検索可能、複数選択
export function PropertyPicker({ open, initiallySelected, onClose, onConfirm }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(initiallySelected);

  useEffect(() => {
    if (!open) return;
    setSelected(initiallySelected);
    setQuery('');
    setLoading(true);
    listProperties()
      .then((res) => setProperties(res.data.filter((p) => p.status === '公開')))
      .finally(() => setLoading(false));
  }, [open, initiallySelected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q),
    );
  }, [query, properties]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div
      className="fixed inset-0 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center z-50 px-6 py-10"
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-ink-muted/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-ink-primary">提案する物件を選択</h2>
            <p className="text-[11px] text-ink-muted">公開中の物件のみ表示しています</p>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary text-xl">×</button>
        </div>

        <div className="px-5 py-3 border-b border-ink-muted/10">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="物件名・エリア・住所で検索"
              autoFocus
              className="w-full pl-9 pr-3 py-2 rounded-md bg-bg-white border border-ink-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="px-5 py-12 text-center text-sm text-ink-muted">読み込み中…</div>}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">該当する物件がありません</div>
          )}
          {!loading &&
            filtered.map((p) => {
              const checked = selected.includes(p.id);
              return (
                <label
                  key={p.id}
                  className="px-5 py-3 border-b border-ink-muted/10 flex items-center gap-4 hover:bg-bg-base/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="w-4 h-4 accent-accent-pine"
                  />
                  <div className="w-14 h-12 rounded bg-bg-base/60 overflow-hidden shrink-0">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-ink-muted">no image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-primary truncate">{p.name}</div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {p.area} / {p.rooms ?? '—'} / {p.sizeSqm ? `${p.sizeSqm.toFixed(1)}㎡` : '—'}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-ink-primary">{formatRent(p.rent)}</div>
                </label>
              );
            })}
        </div>

        <div className="px-5 py-3 border-t border-ink-muted/10 flex items-center justify-between">
          <div className="text-xs text-ink-secondary">{selected.length}件 選択中</div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded border border-ink-muted/30 text-xs text-ink-secondary hover:text-ink-primary"
            >
              キャンセル
            </button>
            <button
              onClick={() => onConfirm(selected)}
              disabled={selected.length === 0}
              className="px-4 py-2 rounded bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90 disabled:opacity-40"
            >
              {selected.length}件を提案に追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
