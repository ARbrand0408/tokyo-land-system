import type { ProposalItem, PublicProposal } from '../../api/types';
import { formatYen } from '../../lib/format';

type Props = {
  proposal: PublicProposal;
  onSignOut: () => void;
};

export function ProposalView({ proposal, onSignOut }: Props) {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-md bg-bg-card min-h-screen shadow-xl">
        {/* コンパクトヘッダー */}
        <header className="px-5 py-4 border-b border-ink-muted/10 flex items-center justify-between bg-bg-card sticky top-0 z-10">
          <div>
            <div className="font-serif text-base text-ink-primary tracking-wide">TOKYO LAND</div>
            <div className="font-mono text-[9px] text-ink-muted tracking-widest mt-0.5">
              CUSTOMER PROPOSAL
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-[11px] text-ink-muted hover:text-ink-primary"
          >
            退出
          </button>
        </header>

        {/* タイトル */}
        <section className="px-5 pt-10 pb-8">
          <div className="font-mono text-[10px] text-ink-muted tracking-widest">
            PROPOSAL №{' '}
            <span className="text-ink-secondary">{proposal.slug.toUpperCase()}</span>
          </div>
          <h1 className="font-serif text-2xl text-ink-primary leading-snug mt-3">
            {proposal.title ?? 'ご提案物件のご案内'}
          </h1>
          <div className="text-sm text-ink-secondary mt-4">
            {proposal.customer.name} 様
          </div>
          {proposal.message && (
            <blockquote className="mt-6 border-l-2 border-accent-pine/60 pl-4 py-1 text-sm text-ink-secondary leading-relaxed">
              {proposal.message}
            </blockquote>
          )}
        </section>

        <Divider />

        {/* 物件リスト */}
        {proposal.items.map((item, idx) => (
          <PropertyEditorial key={item.id} item={item} index={idx} />
        ))}

        <footer className="px-5 py-10 text-center">
          <div className="font-serif text-sm text-ink-primary">
            ご検討のほど、よろしくお願いいたします。
          </div>
          <div className="text-[11px] text-ink-muted mt-3">
            TOKYO LAND / 担当営業より
          </div>
          <div className="font-mono text-[10px] text-ink-muted tracking-widest mt-6">
            © 2026 TOKYO LAND
          </div>
        </footer>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="px-5">
      <div className="border-t border-ink-muted/15" />
    </div>
  );
}

function PropertyEditorial({ item, index }: { item: ProposalItem; index: number }) {
  const p = item.property;

  return (
    <article className="px-5 py-10">
      <div className="font-mono text-[10px] text-ink-muted tracking-widest">
        № {String(index + 1).padStart(2, '0')} / {p.code}
      </div>
      <h2 className="font-serif text-xl text-ink-primary leading-snug mt-2">{p.name}</h2>
      <div className="text-xs text-ink-secondary mt-1">{p.address}</div>

      {/* メイン画像 */}
      {item.propertyImageUrl ? (
        <img
          src={item.propertyImageUrl}
          alt={p.name}
          className="mt-6 w-full rounded-lg shadow-sm object-cover aspect-[4/3] bg-bg-base"
        />
      ) : (
        <div className="mt-6 w-full rounded-lg bg-bg-base aspect-[4/3] flex items-center justify-center text-ink-muted text-xs">
          画像なし
        </div>
      )}

      {/* 価格と要点 */}
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="価格" value={formatYen(p.price)} primary />
        <Stat label="種別" value={p.type} />
        <Stat label="間取り" value={p.rooms} />
        <Stat label="専有面積" value={`${p.sizeSqm.toFixed(1)}㎡`} />
        <Stat label="築年" value={p.builtYear ? `${p.builtYear}年` : '—'} />
        <Stat label="エリア" value={p.area} />
      </div>

      {/* 物件説明 */}
      {p.description && (
        <p className="mt-7 text-sm text-ink-secondary leading-7 font-serif">
          {p.description}
        </p>
      )}

      {/* 担当者コメント */}
      {item.comment && (
        <div className="mt-6 bg-accent-pine/5 border-l-2 border-accent-pine pl-4 py-3">
          <div className="font-mono text-[9px] text-accent-pine tracking-widest">
            FROM AGENT
          </div>
          <div className="text-sm text-ink-primary leading-relaxed mt-1">{item.comment}</div>
        </div>
      )}

      {/* 間取り図 */}
      {item.floorPlanUrl && (
        <div className="mt-8">
          <div className="font-mono text-[10px] text-ink-muted tracking-widest mb-3">
            FLOOR PLAN
          </div>
          <img
            src={item.floorPlanUrl}
            alt={`${p.name} 間取り図`}
            className="w-full rounded-lg border border-ink-muted/15 bg-bg-white object-contain"
          />
        </div>
      )}

      <Divider />
    </article>
  );
}

function Stat({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] text-ink-muted tracking-widest uppercase">
        {label}
      </div>
      <div
        className={[
          'mt-1',
          primary ? 'font-serif text-xl text-ink-primary' : 'text-sm text-ink-primary',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  );
}
