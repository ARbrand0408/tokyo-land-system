import { useState } from 'react';
import type { Customer, CustomerInput } from '../../api/types';

type Props = {
  initial?: Customer | null;
  onCancel: () => void;
  onSubmit: (input: CustomerInput) => Promise<void>;
};

function randomCode(): string {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

const inputCls =
  'w-full bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30';

export function CustomerForm({ initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<CustomerInput>({
    name: initial?.name ?? '',
    companyName: initial?.companyName ?? '',
    accessCode: initial?.accessCode ?? randomCode(),
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    moveInDate: initial?.moveInDate ?? '',
    birthDate: initial?.birthDate ?? '',
    preferences: initial?.preferences ?? '',
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name) {
      setError('顧客名は必須です');
      return;
    }
    if (!form.accessCode || !/^\d{4}$/.test(form.accessCode)) {
      setError('アクセスコードは4桁の数字を指定してください');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center z-50 px-6 py-10"
      onClick={onCancel}
    >
      <div
        className="bg-bg-card rounded-lg shadow-xl w-full max-w-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-ink-muted/10 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink-primary">
            {initial ? '顧客情報を編集' : '新規顧客を追加'}
          </h2>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink-primary text-xl">×</button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-3 py-2 text-xs text-accent-terracotta">
              {error}
            </div>
          )}
          <Field label="名前 (必須)">
            <input value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} className={inputCls} />
          </Field>
          <Field label="会社名">
            <input value={form.companyName ?? ''} onChange={(e) => update('companyName', e.target.value)} className={inputCls} />
          </Field>
          <Field label="アクセスコード (4桁・必須)">
            <div className="flex gap-2">
              <input
                value={form.accessCode ?? ''}
                onChange={(e) => update('accessCode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className={`${inputCls} font-mono tracking-widest text-center`}
              />
              <button
                type="button"
                onClick={() => update('accessCode', randomCode())}
                className="px-3 py-2 rounded border border-ink-muted/30 text-xs text-ink-secondary hover:text-ink-primary"
              >
                再生成
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="メール">
              <input value={form.email ?? ''} onChange={(e) => update('email', e.target.value)} className={inputCls} />
            </Field>
            <Field label="電話">
              <input value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="入居時期 (yyyy-MM)">
              <input value={form.moveInDate ?? ''} onChange={(e) => update('moveInDate', e.target.value)} placeholder="2026-07" className={inputCls} />
            </Field>
            <Field label="生年月日 (yyyy-MM-dd)">
              <input value={form.birthDate ?? ''} onChange={(e) => update('birthDate', e.target.value)} placeholder="1985-04-12" className={inputCls} />
            </Field>
          </div>
          <Field label="ご希望条件">
            <textarea value={form.preferences ?? ''} onChange={(e) => update('preferences', e.target.value)} rows={3} className={inputCls} />
          </Field>
          <Field label="メモ">
            <textarea value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} rows={2} className={inputCls} />
          </Field>
        </div>

        <div className="px-5 py-3 border-t border-ink-muted/10 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded border border-ink-muted/30 text-xs text-ink-secondary hover:text-ink-primary">
            キャンセル
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 rounded bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90 disabled:opacity-40"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-ink-muted">{label}</label>
      {children}
    </div>
  );
}
