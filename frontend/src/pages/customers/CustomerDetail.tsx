import { useEffect, useState } from 'react';
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from '../../api/customers';
import {
  createProposal,
  deleteProposal,
  updateProposal,
} from '../../api/proposals';
import { listProperties } from '../../api/properties';
import { ApiError } from '../../api/client';
import type { CustomerDetail as CustomerDetailType, Proposal, ProposalStatus } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatRent, relativeTime } from '../../lib/format';
import { CustomerForm } from './CustomerForm';
import { PropertyPicker } from './PropertyPicker';
import { ProposalPreview } from './ProposalPreview';

type Props = {
  customerId: string;
  onBack: () => void;
  onDeleted: () => void;
};

export function CustomerDetail({ customerId, onBack, onDeleted }: Props) {
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState(false);

  // 提案エディタ状態（インライン）
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>('下書き');
  const [proposalItems, setProposalItems] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);

  // プレビュー
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomer(customerId);
      setCustomer(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '読み込み失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [customerId]);

  const startNewProposal = () => {
    setEditingProposal(null);
    setIsCreatingProposal(true);
    setProposalTitle('');
    setProposalMessage('');
    setProposalStatus('下書き');
    setProposalItems([]);
  };

  const startEditProposal = (p: Proposal) => {
    setIsCreatingProposal(false);
    setEditingProposal(p);
    setProposalTitle(p.title ?? '');
    setProposalMessage(p.message ?? '');
    setProposalStatus(p.status);
    setProposalItems(p.items.map((i) => i.propertyId));
  };

  const cancelProposal = () => {
    setIsCreatingProposal(false);
    setEditingProposal(null);
    setProposalItems([]);
  };

  const isEditingProposalArea = isCreatingProposal || editingProposal !== null;

  const saveProposal = async () => {
    setSavingProposal(true);
    try {
      if (editingProposal) {
        await updateProposal(editingProposal.id, {
          customerId,
          title: proposalTitle || null,
          message: proposalMessage || null,
          status: proposalStatus,
          propertyIds: proposalItems,
        });
      } else {
        await createProposal({
          customerId,
          title: proposalTitle || null,
          message: proposalMessage || null,
          status: proposalStatus,
          propertyIds: proposalItems,
        });
      }
      cancelProposal();
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSavingProposal(false);
    }
  };

  const removeProposal = async (id: string, title: string | null) => {
    if (!window.confirm(`「${title ?? '無題の提案'}」を削除しますか？`)) return;
    await deleteProposal(id);
    refresh();
  };

  const removeCustomer = async () => {
    if (!customer) return;
    if (!window.confirm(`${customer.name} さんを削除しますか？\n関連する提案も削除されます。`)) return;
    await deleteCustomer(customer.id);
    onDeleted();
  };

  if (loading) return <div className="text-sm text-ink-muted">読み込み中…</div>;
  if (error || !customer) {
    return (
      <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-4 py-3 text-sm text-accent-terracotta">
        {error ?? '顧客が見つかりません'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary border border-ink-muted/30 rounded"
          >
            ← 顧客一覧へ
          </button>
          <div>
            <h1 className="font-serif text-2xl text-ink-primary">{customer.name}</h1>
            {customer.companyName && (
              <div className="text-xs text-ink-muted mt-0.5">{customer.companyName}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingCustomer(true)}
            className="px-3 py-1.5 rounded border border-ink-muted/30 text-xs text-ink-secondary hover:text-ink-primary"
          >
            顧客情報を編集
          </button>
          <button
            onClick={removeCustomer}
            className="px-3 py-1.5 rounded border border-accent-terracotta/40 text-xs text-accent-terracotta hover:bg-accent-terracotta/10"
          >
            顧客を削除
          </button>
        </div>
      </header>

      {/* 顧客情報カード */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-5 grid grid-cols-4 gap-5">
        <InfoCell label="メール" value={customer.email ?? '—'} />
        <InfoCell label="電話" value={customer.phone ?? '—'} />
        <InfoCell label="アクセスコード">
          <span className="font-mono tracking-widest text-ink-primary">{customer.accessCode}</span>
        </InfoCell>
        <InfoCell label="登録日" value={new Date(customer.createdAt).toLocaleDateString('ja-JP')} />
        <InfoCell label="入居時期" value={customer.moveInDate ?? '—'} />
        <InfoCell label="生年月日" value={customer.birthDate ?? '—'} />
        <InfoCell label="ご希望条件" value={customer.preferences ?? '—'} span={2} />
        <InfoCell label="メモ" value={customer.notes ?? '—'} span={4} multiline />
      </section>

      {/* 提案物件リスト */}
      <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-muted/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-ink-primary">提案物件</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">{customer.proposals.length} 件の提案</p>
          </div>
          {!isEditingProposalArea && (
            <button
              onClick={startNewProposal}
              className="px-4 py-2 rounded bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90"
            >
              + 新しい提案を作成
            </button>
          )}
        </div>

        {/* インライン提案エディタ */}
        {isEditingProposalArea && (
          <ProposalInlineEditor
            title={proposalTitle}
            message={proposalMessage}
            status={proposalStatus}
            selectedIds={proposalItems}
            allProperties={customer.proposals
              .flatMap((p) => p.items.map((i) => i.property))
              .concat([])}
            onTitleChange={setProposalTitle}
            onMessageChange={setProposalMessage}
            onStatusChange={setProposalStatus}
            onOpenPicker={() => setPickerOpen(true)}
            onRemoveItem={(id) => setProposalItems((prev) => prev.filter((x) => x !== id))}
            onReorder={(from, to) => {
              setProposalItems((prev) => {
                const next = [...prev];
                const [moved] = next.splice(from, 1);
                if (moved) next.splice(to, 0, moved);
                return next;
              });
            }}
            saving={savingProposal}
            onSave={saveProposal}
            onCancel={cancelProposal}
            isEditingExisting={editingProposal !== null}
          />
        )}

        {!isEditingProposalArea && (
          <div>
            {customer.proposals.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-ink-muted">
                まだ提案がありません。「新しい提案を作成」ボタンから物件を選んで提案を作りましょう。
              </div>
            )}
            {customer.proposals.map((p) => (
              <ProposalRow
                key={p.id}
                proposal={p}
                onEdit={() => startEditProposal(p)}
                onPreview={() => setPreviewProposal(p)}
                onDelete={() => removeProposal(p.id, p.title)}
                customerAccessCode={customer.accessCode}
              />
            ))}
          </div>
        )}
      </section>

      {/* 顧客編集モーダル */}
      {editingCustomer && (
        <CustomerForm
          initial={customer}
          onCancel={() => setEditingCustomer(false)}
          onSubmit={async (input) => {
            await updateCustomer(customer.id, input);
            setEditingCustomer(false);
            refresh();
          }}
        />
      )}

      {/* 物件ピッカー */}
      <PropertyPicker
        open={pickerOpen}
        initiallySelected={proposalItems}
        onClose={() => setPickerOpen(false)}
        onConfirm={(ids) => {
          setProposalItems(ids);
          setPickerOpen(false);
        }}
      />

      {/* iOSフレームプレビュー */}
      {previewProposal && (
        <ProposalPreview
          proposal={previewProposal}
          customerAccessCode={customer.accessCode}
          onClose={() => setPreviewProposal(null)}
        />
      )}
    </div>
  );
}

function InfoCell({
  label,
  value,
  children,
  span = 1,
  multiline,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  span?: number;
  multiline?: boolean;
}) {
  return (
    <div className={`col-span-${span} flex flex-col`}>
      <div className="text-[10px] text-ink-muted tracking-widest uppercase">{label}</div>
      <div className={`text-sm text-ink-primary mt-1 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {children ?? value}
      </div>
    </div>
  );
}

function ProposalRow({
  proposal,
  onEdit,
  onPreview,
  onDelete,
  customerAccessCode,
}: {
  proposal: Proposal;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
  customerAccessCode: string;
}) {
  const url = `${window.location.origin}/p/${proposal.slug}`;
  const [copied, setCopied] = useState<'url' | 'code' | null>(null);
  const copy = async (text: string, kind: 'url' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="px-5 py-4 border-t border-ink-muted/10 first:border-t-0 flex items-center gap-4 hover:bg-bg-base/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <StatusBadge label={proposal.status} tone={proposal.status === '送信済み' ? 'emerald' : 'muted'} />
          <div className="font-medium text-sm text-ink-primary truncate">
            {proposal.title ?? '（タイトルなし）'}
          </div>
        </div>
        <div className="text-[11px] text-ink-muted mt-1">
          {proposal.items.length}件の物件 / 更新 {relativeTime(proposal.updatedAt)}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <RowAction onClick={onPreview} label="プレビュー" />
        <RowAction
          onClick={() => copy(url, 'url')}
          label={copied === 'url' ? '✓ URLコピー' : 'リンクコピー'}
        />
        <RowAction
          onClick={() => copy(customerAccessCode, 'code')}
          label={copied === 'code' ? '✓ PINコピー' : 'PINコピー'}
        />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1 rounded border border-ink-muted/30 text-[11px] text-ink-secondary hover:text-ink-primary hover:border-ink-muted/60"
        >
          開く ↗
        </a>
        <RowAction onClick={onEdit} label="編集" primary />
        <RowAction onClick={onDelete} label="削除" danger />
      </div>
    </div>
  );
}

function RowAction({
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

// インライン提案エディタ
function ProposalInlineEditor({
  title,
  message,
  status,
  selectedIds,
  onTitleChange,
  onMessageChange,
  onStatusChange,
  onOpenPicker,
  onRemoveItem,
  onReorder,
  saving,
  onSave,
  onCancel,
  isEditingExisting,
}: {
  title: string;
  message: string;
  status: ProposalStatus;
  selectedIds: string[];
  allProperties: unknown[]; // unused but kept for future enhancements
  onTitleChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onStatusChange: (s: ProposalStatus) => void;
  onOpenPicker: () => void;
  onRemoveItem: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  isEditingExisting: boolean;
}) {
  return (
    <div className="p-5 bg-bg-base/30 border-b border-ink-muted/10">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-[10px] text-ink-muted tracking-widest">
          {isEditingExisting ? 'EDIT PROPOSAL' : 'NEW PROPOSAL'}
        </span>
        <h3 className="font-serif text-base text-ink-primary">
          {isEditingExisting ? '提案を編集' : '新しい提案'}
        </h3>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-muted">提案タイトル (必須)</label>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="例: 港区エリア・厳選2物件のご提案"
              className="w-full bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-muted">お客様へのメッセージ</label>
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={3}
              placeholder="ご希望の条件に合わせて選定いたしました。"
              className="w-full bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30"
            />
          </div>

          {/* 選択物件リスト */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-ink-muted">
                提案物件 ({selectedIds.length}件)
              </label>
              <button
                onClick={onOpenPicker}
                className="text-xs text-accent-pine hover:underline"
              >
                + 物件を追加・編集
              </button>
            </div>
            <SelectedPropertiesList
              ids={selectedIds}
              onRemove={onRemoveItem}
              onReorder={onReorder}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="bg-bg-card rounded border border-ink-muted/10 p-3">
            <div className="text-[11px] text-ink-muted mb-2">ステータス</div>
            <div className="flex gap-2">
              {(['下書き', '送信済み'] as ProposalStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={[
                    'flex-1 px-2 py-1.5 rounded text-xs border',
                    status === s
                      ? 'border-accent-pine bg-accent-pine/10 text-accent-pine'
                      : 'border-ink-muted/30 text-ink-secondary hover:border-ink-muted/60',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={saving || !title || selectedIds.length === 0}
            className="px-3 py-2.5 rounded bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90 disabled:opacity-40"
          >
            {saving ? '保存中…' : isEditingExisting ? '更新' : '保存'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded border border-ink-muted/30 text-xs text-ink-secondary hover:text-ink-primary"
          >
            キャンセル
          </button>
        </aside>
      </div>
    </div>
  );
}

// 選択した物件IDから物件情報を取得して表示
function SelectedPropertiesList({
  ids,
  onRemove,
  onReorder,
}: {
  ids: string[];
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [properties, setProperties] = useState<Record<string, { name: string; area: string; rooms: string | null; rent: number | null; images: string[] }>>({});

  useEffect(() => {
    if (ids.length === 0) return;
    listProperties().then((res) => {
      const map: typeof properties = {};
      for (const p of res.data) {
        map[p.id] = { name: p.name, area: p.area, rooms: p.rooms, rent: p.rent, images: p.images };
      }
      setProperties(map);
    });
  }, [ids.length]);

  if (ids.length === 0) {
    return (
      <div className="bg-bg-white border border-dashed border-ink-muted/30 rounded p-4 text-center text-xs text-ink-muted">
        物件未選択。「+ 物件を追加・編集」から選んでください
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {ids.map((id, idx) => {
        const p = properties[id];
        return (
          <div
            key={id}
            className="flex items-center gap-3 bg-bg-white rounded border border-ink-muted/15 p-2"
          >
            <span className="font-mono text-[10px] w-8 text-center text-ink-muted">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="w-10 h-10 rounded bg-bg-base/60 overflow-hidden shrink-0">
              {p?.images[0] ? (
                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink-primary truncate">{p?.name ?? '読み込み中…'}</div>
              <div className="text-[11px] text-ink-muted truncate">
                {p ? `${p.area} / ${p.rooms ?? '—'} / ${formatRent(p.rent)}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => idx > 0 && onReorder(idx, idx - 1)}
                disabled={idx === 0}
                className="px-1.5 py-0.5 text-xs text-ink-muted hover:text-ink-primary disabled:opacity-30"
                title="上へ"
              >
                ↑
              </button>
              <button
                onClick={() => idx < ids.length - 1 && onReorder(idx, idx + 1)}
                disabled={idx === ids.length - 1}
                className="px-1.5 py-0.5 text-xs text-ink-muted hover:text-ink-primary disabled:opacity-30"
                title="下へ"
              >
                ↓
              </button>
              <button
                onClick={() => onRemove(id)}
                className="px-2 py-0.5 text-[11px] text-accent-terracotta hover:underline"
              >
                削除
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
