import { useEffect, useMemo, useState } from 'react';
import { UploadZone } from '../components/UploadZone';
import { listCustomers } from '../api/customers';
import { listProperties } from '../api/properties';
import { createProposal } from '../api/proposals';
import { ApiError } from '../api/client';
import type { Customer, Property, Proposal, UploadedAsset } from '../api/types';
import { formatYen } from '../lib/format';

type PublishedInfo = {
  url: string;
  pin: string;
  proposal: Proposal;
};

export function ProposalEditor() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [comment, setComment] = useState('');
  const [propertyImage, setPropertyImage] = useState<UploadedAsset | null>(null);
  const [floorPlan, setFloorPlan] = useState<UploadedAsset | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState<PublishedInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCustomers(), listProperties()])
      .then(([c, p]) => {
        if (cancelled) return;
        setCustomers(c.data);
        setProperties(p.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? `APIエラー: ${err.message}`
            : err instanceof Error
              ? `APIに接続できません: ${err.message}`
              : 'APIに接続できません';
        setLoadError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePropertyId = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectedProperties = useMemo(
    () => properties.filter((p) => selectedPropertyIds.includes(p.id)),
    [properties, selectedPropertyIds],
  );

  const canPublish =
    !publishing && customerId !== '' && selectedPropertyIds.length > 0;

  const publish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublished(null);
    try {
      const res = await createProposal({
        customerId,
        title: title || undefined,
        message: message || undefined,
        items: selectedPropertyIds.map((propertyId, idx) => ({
          propertyId,
          // 1件目に画像を紐づける（MVP: アップロードは1セット）
          propertyImageUrl: idx === 0 ? propertyImage?.url ?? null : null,
          floorPlanUrl: idx === 0 ? floorPlan?.url ?? null : null,
          comment: idx === 0 ? comment || null : null,
        })),
      });
      const proposal = res.data;
      const url = `${window.location.origin}/p/${proposal.slug}`;
      setPublished({ url, pin: proposal.pin, proposal });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `公開に失敗しました: ${err.message}`
          : err instanceof Error
            ? `公開に失敗しました: ${err.message}`
            : '公開に失敗しました';
      setPublishError(message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] tracking-widest text-ink-muted">
          PROPOSAL EDITOR
        </span>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-ink-primary">提案エディタ</h1>
            <p className="text-sm text-ink-secondary mt-1">
              顧客と物件を選択し、お客様専用URLとPINを発行します。
            </p>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-4 py-3 text-sm text-accent-terracotta">
          {loadError}
        </div>
      )}

      {/* 1. 顧客選択 */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-mono text-[10px] text-ink-muted tracking-widest">01</span>
          <h2 className="font-serif text-lg text-ink-primary">送り先の顧客</h2>
        </div>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          disabled={loading}
          className="w-full max-w-md bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
        >
          <option value="">— 顧客を選択 —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} / {c.name} （担当: {c.assignedTo}）
            </option>
          ))}
        </select>
      </section>

      {/* 2. 物件選択 */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-mono text-[10px] text-ink-muted tracking-widest">02</span>
          <h2 className="font-serif text-lg text-ink-primary">提案する物件</h2>
          <span className="text-xs text-ink-muted">
            （{selectedPropertyIds.length} 件選択中）
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {loading && <div className="col-span-3 text-sm text-ink-muted">読み込み中…</div>}
          {!loading &&
            properties.map((p) => {
              const selected = selectedPropertyIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePropertyId(p.id)}
                  className={[
                    'text-left rounded-lg p-4 border transition-all',
                    selected
                      ? 'border-accent-pine bg-accent-pine/10 ring-1 ring-accent-pine/30'
                      : 'border-ink-muted/15 bg-bg-white hover:border-ink-muted/40',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-ink-muted">{p.code}</span>
                    {selected && (
                      <span className="text-[10px] text-accent-pine">✓ 選択中</span>
                    )}
                  </div>
                  <div className="font-medium text-sm text-ink-primary mt-1">{p.name}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">{p.address}</div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-ink-secondary">
                      {p.rooms} / {p.sizeSqm.toFixed(1)}㎡
                    </span>
                    <span className="font-mono text-ink-primary">{formatYen(p.price)}</span>
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      {/* 3. 画像アップロード */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-6">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-mono text-[10px] text-ink-muted tracking-widest">03</span>
          <h2 className="font-serif text-lg text-ink-primary">画像素材</h2>
        </div>
        <p className="text-xs text-ink-muted mb-5">
          選択した1件目の物件に紐付けて公開されます。
        </p>
        <div className="grid grid-cols-2 gap-6">
          <UploadZone
            kind="property_image"
            title="物件画像"
            description="外観・内観などの写真"
            hint="JPEG / PNG / WebP (最大 10MB)"
            onUploaded={setPropertyImage}
          />
          <UploadZone
            kind="floor_plan"
            title="間取り図"
            description="図面・平面図"
            hint="JPEG / PNG / WebP (最大 10MB)"
            onUploaded={setFloorPlan}
          />
        </div>
      </section>

      {/* 4. メッセージ */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-mono text-[10px] text-ink-muted tracking-widest">04</span>
          <h2 className="font-serif text-lg text-ink-primary">お客様へのメッセージ</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">提案タイトル</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 港区エリアのご提案"
              className="bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">1件目の物件へのコメント</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例: 駅から徒歩5分、南向きの角部屋です"
              className="bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs text-ink-muted">本文メッセージ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="ご希望の条件に合わせて選定いたしました。ご検討よろしくお願いいたします。"
              className="bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
            />
          </div>
        </div>
      </section>

      {/* 5. 公開 */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-mono text-[10px] text-ink-muted tracking-widest">05</span>
          <h2 className="font-serif text-lg text-ink-primary">公開してURLを発行</h2>
        </div>

        {!published && (
          <>
            <div className="flex items-center gap-3 mb-4 text-xs text-ink-secondary">
              <Stat label="顧客" value={customerId ? '✓ 選択済み' : '未選択'} ok={!!customerId} />
              <Stat
                label="物件"
                value={`${selectedPropertyIds.length} 件`}
                ok={selectedPropertyIds.length > 0}
              />
              <Stat
                label="画像"
                value={propertyImage ? '✓' : '—'}
                ok={!!propertyImage}
                optional
              />
              <Stat label="間取り図" value={floorPlan ? '✓' : '—'} ok={!!floorPlan} optional />
            </div>
            <button
              onClick={publish}
              disabled={!canPublish}
              className="px-5 py-2.5 rounded-md bg-accent-pine text-bg-white text-sm font-medium hover:bg-accent-pine/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {publishing ? '公開中…' : '公開してURLを発行 →'}
            </button>
          </>
        )}

        {publishError && (
          <div className="mt-4 rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-3 py-2 text-xs text-accent-terracotta">
            {publishError}
          </div>
        )}

        {published && (
          <PublishedCard
            info={published}
            selectedProperties={selectedProperties}
            onPublishAgain={() => setPublished(null)}
          />
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  ok,
  optional,
}: {
  label: string;
  value: string;
  ok: boolean;
  optional?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px]',
        ok
          ? 'border-accent-pine/40 text-accent-pine bg-accent-pine/5'
          : optional
            ? 'border-ink-muted/20 text-ink-muted'
            : 'border-accent-terracotta/30 text-accent-terracotta bg-accent-terracotta/5',
      ].join(' ')}
    >
      <span>{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PublishedCard({
  info,
  selectedProperties,
  onPublishAgain,
}: {
  info: PublishedInfo;
  selectedProperties: Property[];
  onPublishAgain: () => void;
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const copy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-accent-pine/40 bg-accent-pine/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent-pine text-lg">✓</span>
        <div className="font-medium text-sm text-ink-primary">
          公開しました。お客様にURLとPINをお伝えください。
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
        <div className="bg-bg-white rounded border border-ink-muted/15 p-4">
          <div className="text-[10px] text-ink-muted tracking-widest uppercase mb-1.5">
            お客様専用URL
          </div>
          <div className="font-mono text-sm text-ink-primary break-all">{info.url}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => copy(info.url, setCopiedUrl)}
              className="px-3 py-1.5 rounded text-xs bg-ink-primary text-bg-white hover:bg-ink-primary/90"
            >
              {copiedUrl ? '✓ コピーしました' : 'URLをコピー'}
            </button>
            <a
              href={info.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded text-xs border border-ink-muted/30 text-ink-secondary hover:text-ink-primary hover:border-ink-primary"
            >
              新しいタブで開く ↗
            </a>
          </div>
        </div>

        <div className="bg-bg-white rounded border border-ink-muted/15 p-4 text-center min-w-[180px]">
          <div className="text-[10px] text-ink-muted tracking-widest uppercase mb-1.5">
            PIN コード
          </div>
          <div className="font-mono text-3xl text-ink-primary tracking-widest">{info.pin}</div>
          <button
            onClick={() => copy(info.pin, setCopiedPin)}
            className="mt-3 w-full px-3 py-1.5 rounded text-xs bg-accent-terracotta text-bg-white hover:bg-accent-terracotta/90"
          >
            {copiedPin ? '✓ コピー' : 'PINをコピー'}
          </button>
        </div>
      </div>

      <div className="mt-4 text-[11px] text-ink-muted">
        提案 ID: <span className="font-mono">{info.proposal.id}</span> / slug:{' '}
        <span className="font-mono">{info.proposal.slug}</span> / 物件:{' '}
        {selectedProperties.map((p) => p.code).join(', ')}
      </div>

      <button
        onClick={onPublishAgain}
        className="mt-4 text-xs text-ink-secondary hover:text-ink-primary underline"
      >
        別の提案を作る
      </button>
    </div>
  );
}
