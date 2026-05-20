import { useRef, useState } from 'react';
import { uploadAsset } from '../api/upload';
import { ApiError } from '../api/client';
import type { UploadKind, UploadedAsset } from '../api/types';

type Props = {
  kind: UploadKind;
  title: string;
  description: string;
  accept?: string;
  hint?: string;
  onUploaded?: (asset: UploadedAsset) => void;
};

type UploadState =
  | { phase: 'idle' }
  | { phase: 'preview'; file: File; previewUrl: string }
  | { phase: 'uploading'; file: File; previewUrl: string }
  | { phase: 'done'; asset: UploadedAsset; previewUrl: string }
  | { phase: 'error'; message: string; previewUrl?: string };

export function UploadZone({
  kind,
  title,
  description,
  accept = 'image/png,image/jpeg,image/webp',
  hint,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: 'idle' });
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState({ phase: 'uploading', file, previewUrl });

    try {
      const res = await uploadAsset(file, kind);
      setState({ phase: 'done', asset: res.data, previewUrl });
      onUploaded?.(res.data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `アップロード失敗: ${err.message}`
          : err instanceof Error
            ? `アップロード失敗: ${err.message}`
            : 'アップロードに失敗しました';
      setState({ phase: 'error', message, previewUrl });
    }
  };

  const reset = () => {
    if ('previewUrl' in state && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({ phase: 'idle' });
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const showPreview =
    state.phase === 'preview' ||
    state.phase === 'uploading' ||
    state.phase === 'done' ||
    (state.phase === 'error' && state.previewUrl);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-medium text-sm text-ink-primary">{title}</h3>
          <p className="text-[11px] text-ink-muted mt-0.5">{description}</p>
        </div>
        {state.phase !== 'idle' && (
          <button
            onClick={reset}
            className="text-[11px] text-ink-secondary hover:text-accent-terracotta"
          >
            リセット
          </button>
        )}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors min-h-[260px] cursor-pointer overflow-hidden',
          isDragging
            ? 'border-accent-pine bg-accent-pine/5'
            : state.phase === 'error'
              ? 'border-accent-terracotta/50 bg-accent-terracotta/5'
              : state.phase === 'done'
                ? 'border-accent-emerald/50 bg-accent-emerald/5'
                : 'border-ink-muted/30 bg-bg-white hover:border-ink-muted/50 hover:bg-bg-base/30',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={state.phase === 'uploading'}
        />

        {showPreview && state.previewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={state.previewUrl}
              alt={`${title} preview`}
              className="max-h-[220px] w-auto object-contain rounded shadow-sm"
            />
            {state.phase === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-white/70">
                <div className="flex items-center gap-2 text-sm text-ink-primary">
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-accent-pine border-t-transparent animate-spin" />
                  アップロード中…
                </div>
              </div>
            )}
            {state.phase === 'done' && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-accent-emerald text-bg-white text-[10px] font-medium">
                ✓ アップロード完了
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center text-2xl text-ink-muted">
              ⬆
            </div>
            <div className="text-center px-4">
              <div className="text-sm text-ink-primary">
                ファイルをドラッグ&ドロップ または{' '}
                <span className="text-accent-pine underline">クリックして選択</span>
              </div>
              {hint && <div className="text-[11px] text-ink-muted mt-1">{hint}</div>}
            </div>
          </>
        )}
      </label>

      {state.phase === 'done' && (
        <div className="rounded-md bg-bg-base/50 px-3 py-2 text-[11px] font-mono text-ink-secondary break-all">
          <div className="text-ink-muted text-[10px] tracking-wider uppercase">storage url</div>
          {state.asset.url}
        </div>
      )}

      {state.phase === 'error' && (
        <div className="rounded-md border border-accent-terracotta/40 bg-accent-terracotta/10 px-3 py-2 text-xs text-accent-terracotta">
          {state.message}
        </div>
      )}
    </div>
  );
}
