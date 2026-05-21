import { useState } from 'react';
import type { Proposal, ProposalItem, PublicProposal } from '../../api/types';
import { formatRent } from '../../lib/format';

type Props = {
  proposal: Proposal | PublicProposal;
  onSelectItem: (itemId: string) => void;
};

export function CustomerAppList({ proposal, onSelectItem }: Props) {
  return (
    <div className="min-h-full bg-bg-card">
      <header className="px-5 pt-6 pb-5 border-b border-ink-muted/10">
        <div className="font-mono text-[9px] text-ink-muted tracking-widest">TOKYO LAND</div>
        <div className="font-serif text-base text-ink-primary mt-1">{proposal.customer.name} 様</div>
        {proposal.title && (
          <h1 className="font-serif text-xl text-ink-primary mt-3 leading-snug">{proposal.title}</h1>
        )}
        {proposal.message && (
          <p className="text-xs text-ink-secondary mt-3 leading-relaxed whitespace-pre-wrap">
            {proposal.message}
          </p>
        )}
        <div className="font-mono text-[10px] text-ink-muted tracking-widest mt-4">
          PROPERTIES · {String(proposal.items.length).padStart(2, '0')}件
        </div>
      </header>

      <div className="px-5 py-5 space-y-4">
        {proposal.items.map((item, idx) => (
          <PropertyCard
            key={item.id}
            item={item}
            index={idx + 1}
            onClick={() => onSelectItem(item.id)}
          />
        ))}
        {proposal.items.length === 0 && (
          <div className="py-12 text-center text-xs text-ink-muted">
            提案物件がまだありません
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({
  item,
  index,
  onClick,
}: {
  item: ProposalItem;
  index: number;
  onClick: () => void;
}) {
  const p = item.property;
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);
  const station = p.stations[0];

  const copyName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(p.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-bg-white border border-ink-muted/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <div className="aspect-[4/3] bg-bg-base overflow-hidden">
          {p.images[0] ? (
            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
              画像なし
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-ink-primary/70 text-bg-white font-mono text-[10px] tracking-widest">
          {String(index).padStart(2, '0')}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFav((v) => !v);
          }}
          className={[
            'absolute top-3 right-3 w-9 h-9 rounded-full bg-bg-card/95 flex items-center justify-center text-lg',
            fav ? 'text-accent-terracotta' : 'text-ink-muted',
          ].join(' ')}
        >
          {fav ? '♥' : '♡'}
        </button>
      </div>

      <div className="p-4">
        <div className="text-[10px] text-ink-muted tracking-widest uppercase">{p.area}</div>
        <div
          className="font-serif text-base text-ink-primary mt-1 leading-snug"
          onClick={copyName}
          title="タップで物件名コピー"
        >
          {p.name} {copied && <span className="text-[10px] text-accent-pine ml-1">✓コピー</span>}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-secondary">
          {p.rooms && <span>{p.rooms}</span>}
          {p.sizeSqm && <span>· {p.sizeSqm.toFixed(1)}㎡</span>}
          {station && (
            <span>· {station.station} 徒歩{station.walkMin}分</span>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="font-serif text-lg text-ink-primary">{formatRent(p.rent)}</span>
            <span className="text-[10px] text-ink-muted ml-1">/ 月</span>
          </div>
          <span className="text-[11px] text-accent-pine">詳細を見る →</span>
        </div>
      </div>
    </button>
  );
}
