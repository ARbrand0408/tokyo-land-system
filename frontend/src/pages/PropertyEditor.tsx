import { useEffect, useRef, useState } from 'react';
import {
  createProperty,
  extractPropertyFromPdf,
  getProperty,
  updateProperty,
} from '../api/properties';
import { uploadAsset } from '../api/upload';
import { ApiError } from '../api/client';
import type {
  Property,
  PropertyInput,
  PropertyStatus,
  PropertyType,
  Station,
} from '../api/types';

const TOKYO_23 = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区',
  '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区',
  '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区',
  '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区',
];

const PROPERTY_TYPES: PropertyType[] = [
  '賃貸マンション',
  '賃貸戸建て',
  '売買マンション',
  '売買戸建て',
];

const PRESET_FACILITIES = [
  'コンシェルジュ',
  'オートロック',
  '宅配ボックス',
  'フィットネス',
  'プール',
  'ラウンジ',
  'ゲストルーム',
  '車寄せ',
  '駐車場',
  'ペット可',
];

type Empty = {
  name: '';
  propertyType: PropertyType;
  area: '';
  address: '';
  stations: Station[];
  highlights: string[];
  facilities: string[];
  images: string[];
  status: PropertyStatus;
};

function emptyForm(): Empty & Partial<Property> {
  return {
    name: '',
    propertyType: '賃貸マンション',
    area: '',
    address: '',
    stations: [],
    highlights: [],
    facilities: [],
    images: [],
    status: '下書き',
  };
}

type Props = {
  propertyId: string | null;
  onBack: () => void;
};

export function PropertyEditor({ propertyId, onBack }: Props) {
  const [form, setForm] = useState<Partial<Property>>(emptyForm());
  const [loading, setLoading] = useState(!!propertyId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    getProperty(propertyId)
      .then((res) => setForm(res.data))
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : '読み込み失敗';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [propertyId]);

  const update = <K extends keyof Property>(k: K, v: Property[K] | null) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const save = async (statusOverride?: PropertyStatus) => {
    if (!form.name) {
      setError('物件名は必須です');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: PropertyInput = {
        ...form,
        status: statusOverride ?? form.status ?? '下書き',
      };
      if (propertyId) {
        await updateProperty(propertyId, payload);
      } else {
        await createProperty(payload);
      }
      onBack();
    } catch (err) {
      const message =
        err instanceof ApiError ? `保存に失敗: ${err.message}` : '保存に失敗しました';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const res = await uploadAsset(file, 'property_image');
    update('images', [...(form.images ?? []), res.data.url]);
  };

  const handleFloorPlanUpload = async (file: File) => {
    const res = await uploadAsset(file, 'floor_plan');
    update('floorPlanUrl', res.data.url);
  };

  const handlePdfExtract = async (file: File) => {
    setError(null);
    setExtractNotice(null);
    setExtracting(true);
    try {
      const res = await extractPropertyFromPdf(file);
      const extracted = res.data.extracted as Partial<Property>;
      // 空欄のみ上書き（ユーザーが既に入力した値は保護）
      setForm((prev) => {
        const next: Partial<Property> = { ...prev };
        const applied: string[] = [];
        for (const [key, value] of Object.entries(extracted)) {
          const k = key as keyof Property;
          if (value == null) continue;
          if (Array.isArray(value) && value.length === 0) continue;
          const current = prev[k];
          const isEmpty =
            current == null ||
            current === '' ||
            (Array.isArray(current) && current.length === 0);
          if (!isEmpty) continue;
          (next as Record<string, unknown>)[k] = value;
          applied.push(k);
        }
        if (applied.length === 0) {
          setExtractNotice(
            res.data.matchedFields.length > 0
              ? `PDFから${res.data.matchedFields.length}項目を検出しましたが、いずれもフォーム入力済みのため上書きしませんでした。`
              : 'PDFから抽出できる項目が見つかりませんでした。',
          );
        } else {
          setExtractNotice(`PDFから${applied.length}項目を自動入力しました: ${applied.join('、')}`);
        }
        return next;
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? `PDF抽出に失敗: ${err.message}` : 'PDF抽出に失敗しました';
      setError(message);
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-ink-muted">読み込み中…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary border border-ink-muted/30 rounded"
          >
            ← 一覧へ戻る
          </button>
          <h1 className="font-serif text-2xl text-ink-primary">
            {propertyId ? '物件編集' : '新規物件登録'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await handlePdfExtract(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={extracting}
            className="px-3 py-2 text-xs rounded-md border border-accent-pine/40 text-accent-pine hover:bg-accent-pine/10 disabled:opacity-40"
          >
            {extracting ? '解析中…' : '✨ PDFから抽出'}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-4 py-3 text-sm text-accent-terracotta">
          {error}
        </div>
      )}

      {extractNotice && (
        <div className="rounded-md border border-accent-pine/40 bg-accent-pine/10 px-4 py-3 text-sm text-accent-pine flex items-start justify-between gap-3">
          <span>{extractNotice}</span>
          <button
            onClick={() => setExtractNotice(null)}
            className="text-accent-pine/70 hover:text-accent-pine text-xs"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <Section title="基本情報">
            <Field label="物件名 (必須)">
              <input
                value={form.name ?? ''}
                onChange={(e) => update('name', e.target.value)}
                className={inputCls}
                placeholder="例: パークコート南青山"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="種別">
                <select
                  value={form.propertyType ?? '賃貸マンション'}
                  onChange={(e) => update('propertyType', e.target.value as PropertyType)}
                  className={inputCls}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="エリア">
                <select
                  value={form.area ?? ''}
                  onChange={(e) => update('area', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— 選択 —</option>
                  {TOKYO_23.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
            </div>
            <Field label="所在地">
              <input
                value={form.address ?? ''}
                onChange={(e) => update('address', e.target.value)}
                className={inputCls}
                placeholder="例: 東京都港区南青山4-12-3"
              />
            </Field>
          </Section>

          <Section title="交通（駅情報）">
            <StationEditor
              stations={form.stations ?? []}
              onChange={(stations) => update('stations', stations)}
            />
          </Section>

          <Section title="物件のポイント">
            <ListEditor
              items={form.highlights ?? []}
              placeholder="例: 駅徒歩5分・南向き角部屋"
              onChange={(highlights) => update('highlights', highlights)}
            />
          </Section>

          <Section title="建物概要">
            <div className="grid grid-cols-3 gap-3">
              <Field label="間取り">
                <input value={form.rooms ?? ''} onChange={(e) => update('rooms', e.target.value)} className={inputCls} placeholder="3LDK" />
              </Field>
              <Field label="専有面積 (㎡)">
                <input type="number" step="0.1" value={form.sizeSqm ?? ''} onChange={(e) => update('sizeSqm', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="専用テラス面積 (㎡)">
                <input type="number" step="0.1" value={form.terraceSqm ?? ''} onChange={(e) => update('terraceSqm', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="所在階">
                <input type="number" value={form.floor ?? ''} onChange={(e) => update('floor', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="地上階数">
                <input type="number" value={form.totalFloors ?? ''} onChange={(e) => update('totalFloors', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="地下階数">
                <input type="number" value={form.basementFloors ?? ''} onChange={(e) => update('basementFloors', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="築年月">
                <input value={form.builtYearMonth ?? ''} onChange={(e) => update('builtYearMonth', e.target.value)} placeholder="2023-04" className={inputCls} />
              </Field>
              <Field label="構造">
                <input value={form.structure ?? ''} onChange={(e) => update('structure', e.target.value)} placeholder="RC造" className={inputCls} />
              </Field>
              <Field label="総戸数">
                <input type="number" value={form.totalUnits ?? ''} onChange={(e) => update('totalUnits', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="主要採光面">
                <input value={form.mainLight ?? ''} onChange={(e) => update('mainLight', e.target.value)} placeholder="南" className={inputCls} />
              </Field>
              <Field label="入居可能時期">
                <input value={form.availableFrom ?? ''} onChange={(e) => update('availableFrom', e.target.value)} placeholder="即入居可" className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="金額・契約条件">
            <div className="grid grid-cols-3 gap-3">
              <Field label="月額賃料 (円)">
                <input type="number" value={form.rent ?? ''} onChange={(e) => update('rent', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="管理費 (円)">
                <input type="number" value={form.maintenanceFee ?? ''} onChange={(e) => update('maintenanceFee', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </Field>
              <Field label="敷金">
                <input value={form.deposit ?? ''} onChange={(e) => update('deposit', e.target.value)} placeholder="2ヶ月" className={inputCls} />
              </Field>
              <Field label="礼金">
                <input value={form.keyMoney ?? ''} onChange={(e) => update('keyMoney', e.target.value)} placeholder="1ヶ月" className={inputCls} />
              </Field>
              <Field label="仲介手数料">
                <input value={form.brokerFee ?? ''} onChange={(e) => update('brokerFee', e.target.value)} placeholder="1ヶ月" className={inputCls} />
              </Field>
              <Field label="更新料">
                <input value={form.renewalFee ?? ''} onChange={(e) => update('renewalFee', e.target.value)} className={inputCls} />
              </Field>
              <Field label="契約期間">
                <input value={form.contractTerm ?? ''} onChange={(e) => update('contractTerm', e.target.value)} placeholder="2年" className={inputCls} />
              </Field>
              <Field label="解約予告">
                <input value={form.cancelNotice ?? ''} onChange={(e) => update('cancelNotice', e.target.value)} placeholder="2ヶ月前" className={inputCls} />
              </Field>
              <Field label="保険">
                <input value={form.insurance ?? ''} onChange={(e) => update('insurance', e.target.value)} className={inputCls} />
              </Field>
              <Field label="保証会社">
                <input value={form.guarantor ?? ''} onChange={(e) => update('guarantor', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="ご利用条件">
            <div className="grid grid-cols-3 gap-3">
              <Field label="事務所使用"><input value={form.officeUse ?? ''} onChange={(e) => update('officeUse', e.target.value)} className={inputCls} /></Field>
              <Field label="SOHO使用"><input value={form.sohoUse ?? ''} onChange={(e) => update('sohoUse', e.target.value)} className={inputCls} /></Field>
              <Field label="ペット"><input value={form.pets ?? ''} onChange={(e) => update('pets', e.target.value)} className={inputCls} /></Field>
              <Field label="楽器"><input value={form.instruments ?? ''} onChange={(e) => update('instruments', e.target.value)} className={inputCls} /></Field>
              <Field label="喫煙"><input value={form.smoking ?? ''} onChange={(e) => update('smoking', e.target.value)} className={inputCls} /></Field>
              <Field label="現況"><input value={form.currentStatus ?? ''} onChange={(e) => update('currentStatus', e.target.value)} className={inputCls} /></Field>
            </div>
          </Section>

          <Section title="駐車場">
            <div className="grid grid-cols-2 gap-3">
              <Field label="駐車場情報"><input value={form.parking ?? ''} onChange={(e) => update('parking', e.target.value)} placeholder="機械式・空き有り" className={inputCls} /></Field>
              <Field label="月額料金"><input value={form.parkingFee ?? ''} onChange={(e) => update('parkingFee', e.target.value)} placeholder="50,000円/月" className={inputCls} /></Field>
            </div>
          </Section>

          <Section title="説明・設備">
            <Field label="物件説明">
              <textarea
                value={form.description ?? ''}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className={inputCls}
              />
            </Field>
            <Field label="設備">
              <FacilitiesEditor
                facilities={form.facilities ?? []}
                onChange={(f) => update('facilities', f)}
              />
            </Field>
          </Section>
        </div>

        {/* 右カラム */}
        <aside className="flex flex-col gap-5 sticky top-4">
          <Section title="ステータス">
            <div className="flex gap-2">
              {(['公開', '下書き'] as PropertyStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => update('status', s)}
                  className={[
                    'flex-1 px-3 py-2 rounded text-xs border',
                    form.status === s
                      ? 'border-accent-pine bg-accent-pine/10 text-accent-pine'
                      : 'border-ink-muted/30 text-ink-secondary hover:border-ink-muted/60',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => save()}
                disabled={saving}
                className="flex-1 px-3 py-2 rounded bg-accent-pine text-bg-white text-xs font-medium hover:bg-accent-pine/90 disabled:opacity-40"
              >
                {saving ? '保存中…' : '保存'}
              </button>
              <button
                onClick={onBack}
                className="px-3 py-2 rounded border border-ink-muted/30 text-xs text-ink-secondary hover:text-ink-primary"
              >
                キャンセル
              </button>
            </div>
          </Section>

          <Section title="物件写真">
            <ImageGallery
              urls={form.images ?? []}
              onUpload={handleImageUpload}
              onRemove={(idx) => {
                const next = (form.images ?? []).filter((_, i) => i !== idx);
                update('images', next);
              }}
            />
          </Section>

          <Section title="間取り画像">
            <FloorPlanUploader
              url={form.floorPlanUrl ?? null}
              onUpload={handleFloorPlanUpload}
              onRemove={() => update('floorPlanUrl', null)}
            />
          </Section>
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  'w-full bg-bg-white border border-ink-muted/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pine/30';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-bg-card rounded-lg border border-ink-muted/10 shadow-sm p-5">
      <h2 className="font-serif text-base text-ink-primary mb-3">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
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

function StationEditor({
  stations,
  onChange,
}: {
  stations: Station[];
  onChange: (s: Station[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {stations.map((s, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_100px_auto] gap-2">
          <input
            value={s.line}
            onChange={(e) => {
              const next = [...stations];
              next[idx] = { ...s, line: e.target.value };
              onChange(next);
            }}
            placeholder="路線名"
            className={inputCls}
          />
          <input
            value={s.station}
            onChange={(e) => {
              const next = [...stations];
              next[idx] = { ...s, station: e.target.value };
              onChange(next);
            }}
            placeholder="駅名"
            className={inputCls}
          />
          <input
            type="number"
            value={s.walkMin}
            onChange={(e) => {
              const next = [...stations];
              next[idx] = { ...s, walkMin: Number(e.target.value) };
              onChange(next);
            }}
            placeholder="徒歩(分)"
            className={inputCls}
          />
          <button
            onClick={() => onChange(stations.filter((_, i) => i !== idx))}
            className="px-2 text-xs text-accent-terracotta hover:underline"
          >
            削除
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...stations, { line: '', station: '', walkMin: 0 }])}
        className="self-start px-3 py-1.5 text-xs rounded border border-ink-muted/30 text-ink-secondary hover:text-ink-primary"
      >
        + 駅を追加
      </button>
    </div>
  );
}

function ListEditor({
  items,
  placeholder,
  onChange,
}: {
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="flex-1 px-3 py-2 bg-bg-white rounded border border-ink-muted/15 text-sm">
            {it}
          </span>
          <button
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="text-xs text-accent-terracotta hover:underline"
          >
            削除
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          onClick={add}
          className="px-3 py-2 text-xs rounded bg-accent-pine text-bg-white hover:bg-accent-pine/90"
        >
          追加
        </button>
      </div>
    </div>
  );
}

function FacilitiesEditor({
  facilities,
  onChange,
}: {
  facilities: string[];
  onChange: (f: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const toggle = (name: string) => {
    if (facilities.includes(name)) {
      onChange(facilities.filter((x) => x !== name));
    } else {
      onChange([...facilities, name]);
    }
  };
  const addCustom = () => {
    const v = draft.trim();
    if (!v) return;
    if (!facilities.includes(v)) onChange([...facilities, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_FACILITIES.map((f) => (
          <button
            key={f}
            onClick={() => toggle(f)}
            className={[
              'px-3 py-1.5 rounded-full text-xs border',
              facilities.includes(f)
                ? 'bg-accent-pine/10 border-accent-pine/40 text-accent-pine'
                : 'bg-bg-white border-ink-muted/20 text-ink-secondary hover:border-ink-muted/40',
            ].join(' ')}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="カスタム設備をEnterで追加"
          className={inputCls}
        />
        <button
          onClick={addCustom}
          className="px-3 py-2 text-xs rounded bg-accent-pine text-bg-white hover:bg-accent-pine/90"
        >
          追加
        </button>
      </div>
      {facilities.filter((f) => !PRESET_FACILITIES.includes(f)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {facilities
            .filter((f) => !PRESET_FACILITIES.includes(f))
            .map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full bg-bg-base text-xs text-ink-secondary inline-flex items-center gap-1.5"
              >
                {f}
                <button
                  onClick={() => onChange(facilities.filter((x) => x !== f))}
                  className="text-ink-muted hover:text-accent-terracotta"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function ImageGallery({
  urls,
  onUpload,
  onRemove,
}: {
  urls: string[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (idx: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {urls.map((u, idx) => (
          <div key={u} className="relative aspect-square rounded overflow-hidden border border-ink-muted/15">
            <img src={u} alt="" className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] bg-accent-pine text-bg-white rounded">
                MAIN
              </span>
            )}
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink-primary/60 text-bg-white text-[10px] hover:bg-accent-terracotta"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;
            setUploading(true);
            try {
              for (const file of files) await onUpload(file);
            } finally {
              setUploading(false);
              e.target.value = '';
            }
          }}
        />
        <div className="border-2 border-dashed border-ink-muted/30 rounded p-4 text-center text-xs text-ink-secondary hover:border-ink-muted/60">
          {uploading ? 'アップロード中…' : '+ 写真をアップロード (複数可)'}
        </div>
      </label>
    </div>
  );
}

function FloorPlanUploader({
  url,
  onUpload,
  onRemove,
}: {
  url: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {url && (
        <div className="relative rounded border border-ink-muted/15 bg-bg-white p-2">
          <img src={url} alt="間取り" className="w-full h-auto" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 px-2 py-0.5 rounded bg-ink-primary/60 text-bg-white text-[10px] hover:bg-accent-terracotta"
          >
            削除
          </button>
        </div>
      )}
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              await onUpload(file);
            } finally {
              setUploading(false);
              e.target.value = '';
            }
          }}
        />
        <div className="border-2 border-dashed border-ink-muted/30 rounded p-4 text-center text-xs text-ink-secondary hover:border-ink-muted/60">
          {uploading ? 'アップロード中…' : url ? '差し替え' : '+ 間取り図をアップロード'}
        </div>
      </label>
    </div>
  );
}
