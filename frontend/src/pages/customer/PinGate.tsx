import { useRef, useState } from 'react';

type Props = {
  slug: string;
  initialError?: string | null;
  onSubmit: (pin: string) => Promise<void>;
};

export function PinGate({ slug, initialError, onSubmit }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  const setDigitAt = (idx: number, value: string) => {
    const v = value.replace(/[^0-9]/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 3) inputs.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i] ?? '';
    setDigits(next);
    inputs.current[Math.min(text.length, 3)]?.focus();
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter') {
      void submit();
    }
  };

  const submit = async () => {
    const pin = digits.join('');
    if (pin.length !== 4) {
      setError('4桁のPINを入力してください');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(pin);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'PINが一致しませんでした';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-serif text-2xl text-ink-primary tracking-wide">TOKYO LAND</div>
          <div className="font-mono text-[10px] text-ink-muted mt-1 tracking-widest">
            CUSTOMER PROPOSAL
          </div>
        </div>

        <div className="bg-bg-card rounded-xl border border-ink-muted/10 shadow-sm p-8">
          <h1 className="font-serif text-xl text-ink-primary text-center">PIN コードを入力</h1>
          <p className="text-xs text-ink-muted text-center mt-2">
            担当者からお伝えした4桁のコードを入力してください
          </p>

          <div className="flex justify-center gap-3 mt-7">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigitAt(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                disabled={submitting}
                className="w-14 h-16 rounded-lg bg-bg-white border border-ink-muted/30 text-center font-mono text-2xl text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-pine/40 focus:border-accent-pine/50"
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 text-xs text-center text-accent-terracotta">{error}</div>
          )}

          <button
            onClick={submit}
            disabled={submitting || digits.join('').length !== 4}
            className="mt-6 w-full py-3 rounded-lg bg-accent-pine text-bg-white text-sm font-medium hover:bg-accent-pine/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '確認中…' : '閲覧する'}
          </button>

          <div className="mt-6 text-[10px] text-center text-ink-muted font-mono tracking-wider">
            ref / {slug}
          </div>
        </div>

        <div className="text-center text-[11px] text-ink-muted mt-6">
          PINが分からない場合は担当者までお問い合わせください
        </div>
      </div>
    </div>
  );
}
