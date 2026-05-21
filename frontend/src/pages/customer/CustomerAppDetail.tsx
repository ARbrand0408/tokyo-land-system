import { useMemo, useState } from 'react';
import type { Proposal, PublicProposal } from '../../api/types';
import { formatRent } from '../../lib/format';

type Props = {
  proposal: Proposal | PublicProposal;
  itemId: string;
  onBack: () => void;
};

type Tab = 'overview' | 'facilities';

export function CustomerAppDetail({ proposal, itemId, onBack }: Props) {
  const item = useMemo(() => proposal.items.find((i) => i.id === itemId), [proposal, itemId]);
  const [tab, setTab] = useState<Tab>('overview');
  const [imageIdx, setImageIdx] = useState(0);
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!item) {
    return (
      <div className="p-6 text-sm text-ink-muted">物件が見つかりません</div>
    );
  }
  const p = item.property;
  const images = p.images.length > 0 ? p.images : [];

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(p.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const prevImage = () => setImageIdx((idx) => Math.max(0, idx - 1));
  const nextImage = () => setImageIdx((idx) => Math.min(images.length - 1, idx + 1));

  return (
    <div className="min-h-full bg-bg-card flex flex-col">
      {/* トップバー */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-ink-muted/10 bg-bg-card sticky top-0 z-10">
        <button onClick={onBack} className="text-sm text-ink-secondary">← 戻る</button>
        <button
          onClick={() => setFav((v) => !v)}
          className={`text-xl ${fav ? 'text-accent-terracotta' : 'text-ink-muted'}`}
        >
          {fav ? '♥' : '♡'}
        </button>
      </div>

      {/* カルーセル */}
      <div className="relative bg-bg-base aspect-[4/3] overflow-hidden">
        {images.length > 0 ? (
          <img src={images[imageIdx]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
            画像なし
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              disabled={imageIdx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-bg-card/90 disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              disabled={imageIdx === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-bg-card/90 disabled:opacity-30"
            >
              ›
            </button>
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-ink-primary/70 text-bg-white font-mono text-[10px]">
              {imageIdx + 1}/{images.length}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={[
                    'w-1.5 h-1.5 rounded-full',
                    idx === imageIdx ? 'bg-bg-card' : 'bg-bg-card/40',
                  ].join(' ')}
                />
              ))}
            </div>
            {imageIdx === 0 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-bg-card/90 font-mono tracking-widest">
                SWIPE →
              </div>
            )}
          </>
        )}
      </div>

      {/* 物件ヘッダー */}
      <div className="px-5 pt-5 pb-3">
        <div className="text-[10px] text-ink-muted tracking-widest">{p.area} · {p.propertyType}</div>
        <h1 className="font-serif text-xl text-ink-primary mt-1 leading-snug">{p.name}</h1>
      </div>

      {/* 価格 */}
      <div className="px-5 pb-4">
        <div className="bg-bg-base/50 rounded-lg p-4 flex items-baseline gap-3">
          <div>
            <div className="text-[10px] text-ink-muted">月額</div>
            <div className="font-serif text-2xl text-ink-primary">{formatRent(p.rent)}</div>
          </div>
          {p.maintenanceFee != null && (
            <div className="ml-auto text-right">
              <div className="text-[10px] text-ink-muted">管理費</div>
              <div className="text-sm text-ink-primary">{formatRent(p.maintenanceFee)}</div>
            </div>
          )}
        </div>
      </div>

      {/* 間取り画像 */}
      {p.floorPlanUrl && (
        <div className="px-5 pb-4">
          <div className="rounded-lg border border-ink-muted/15 bg-bg-white p-2">
            <img src={p.floorPlanUrl} alt="間取り" className="w-full object-contain" />
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="px-5 sticky top-12 bg-bg-card z-10">
        <div className="flex gap-2 border-b border-ink-muted/15">
          {[
            { key: 'overview', label: '概要' },
            { key: 'facilities', label: '設備' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={[
                'px-4 py-2 text-sm border-b-2 -mb-px',
                tab === t.key
                  ? 'border-accent-pine text-ink-primary'
                  : 'border-transparent text-ink-muted',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">
        {tab === 'overview' && <OverviewPanel proposal={proposal} item={item} />}
        {tab === 'facilities' && <FacilitiesPanel facilities={p.facilities} />}
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 px-4 py-3 bg-bg-card border-t border-ink-muted/10">
        <button
          onClick={copyName}
          className="w-full py-3 rounded-lg bg-accent-pine text-bg-white text-sm font-medium hover:bg-accent-pine/90"
        >
          {copied ? '✓ 物件名をコピーしました' : '物件名をコピーして問い合わせ'}
        </button>
      </div>
    </div>
  );
}

function OverviewPanel({
  proposal,
  item,
}: {
  proposal: Proposal | PublicProposal;
  item: Proposal['items'][number];
}) {
  const p = item.property;
  return (
    <>
      {p.highlights.length > 0 && (
        <Section title="HIGHLIGHTS">
          <ul className="space-y-2">
            {p.highlights.map((h, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-ink-primary leading-relaxed">
                <span className="text-accent-pine mt-0.5">◆</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {p.description && (
        <Section title="概要">
          <p className="text-sm text-ink-primary leading-relaxed whitespace-pre-wrap">{p.description}</p>
        </Section>
      )}

      {p.stations.length > 0 && (
        <Section title="ACCESS">
          <ul className="space-y-1.5">
            {p.stations.map((s, idx) => (
              <li key={idx} className="text-sm text-ink-primary">
                {s.line} <span className="text-ink-secondary">/</span> {s.station}駅 徒歩 {s.walkMin}分
              </li>
            ))}
          </ul>
        </Section>
      )}

      {p.address && (
        <Section title="LOCATION">
          <div className="text-sm text-ink-primary">{p.address}</div>
        </Section>
      )}

      {p.floorPlanUrl && (
        <Section title="FLOOR PLAN">
          <img src={p.floorPlanUrl} alt="間取り" className="w-full rounded-lg bg-bg-white border border-ink-muted/15" />
        </Section>
      )}

      <Section title="BUILDING">
        <TableRows
          rows={[
            ['間取り', p.rooms],
            ['専有面積', p.sizeSqm != null ? `${p.sizeSqm}㎡` : null],
            ['専用テラス', p.terraceSqm != null ? `${p.terraceSqm}㎡` : null],
            ['所在階 / 階数', p.floor != null || p.totalFloors != null
              ? `${p.floor ?? '—'}階 / 地上${p.totalFloors ?? '—'}階${p.basementFloors ? ` 地下${p.basementFloors}階` : ''}`
              : null],
            ['築年月', p.builtYearMonth],
            ['構造', p.structure],
            ['総戸数', p.totalUnits != null ? `${p.totalUnits}戸` : null],
            ['主要採光面', p.mainLight],
            ['入居可能時期', p.availableFrom],
          ]}
        />
      </Section>

      <Section title="CONTRACT">
        <TableRows
          rows={[
            ['敷金', p.deposit],
            ['礼金', p.keyMoney],
            ['仲介手数料', p.brokerFee],
            ['更新料', p.renewalFee],
            ['契約期間', p.contractTerm],
            ['解約予告', p.cancelNotice],
            ['保険', p.insurance],
            ['保証会社', p.guarantor],
          ]}
        />
      </Section>

      <Section title="RESTRICTIONS">
        <TableRows
          rows={[
            ['事務所使用', p.officeUse],
            ['SOHO使用', p.sohoUse],
            ['ペット', p.pets],
            ['楽器', p.instruments],
            ['喫煙', p.smoking],
            ['現況', p.currentStatus],
          ]}
        />
      </Section>

      {(p.parking || p.parkingFee) && (
        <Section title="PARKING">
          <TableRows rows={[['駐車場', p.parking], ['月額', p.parkingFee]]} />
        </Section>
      )}

      <div className="pt-2 text-[10px] text-ink-muted text-center font-mono tracking-widest">
        {proposal.title ? `from "${proposal.title}"` : ''}
      </div>
    </>
  );
}

function FacilitiesPanel({ facilities }: { facilities: string[] }) {
  if (facilities.length === 0) {
    return <div className="text-sm text-ink-muted">設備情報はありません</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {facilities.map((f, idx) => (
        <div
          key={idx}
          className="px-3 py-3 rounded-lg bg-bg-base/60 text-sm text-ink-primary flex items-center gap-2"
        >
          <span className="text-accent-pine">◆</span>
          {f}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="font-mono text-[10px] text-ink-muted tracking-widest mb-3">{title}</div>
      {children}
    </section>
  );
}

function TableRows({ rows }: { rows: Array<[string, string | number | null | undefined]> }) {
  const visible = rows.filter(([, v]) => v != null && v !== '');
  if (visible.length === 0) {
    return <div className="text-xs text-ink-muted">情報なし</div>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {visible.map(([k, v]) => (
          <tr key={k} className="border-b border-ink-muted/10 last:border-b-0">
            <td className="py-2 pr-3 text-[11px] text-ink-muted w-32 align-top">{k}</td>
            <td className="py-2 text-ink-primary">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
