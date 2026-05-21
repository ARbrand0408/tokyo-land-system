import { useRef, useState } from 'react';

type Props = {
  customerName: string;
  // 正しいコード（クライアントサイド検証用 = プレビュー時のみ）
  correctCode?: string;
  // 実際のAPI認証時に使う送信ハンドラ
  onAuthenticated: (code: string) => void;
  errorMessage?: string | null;
};

export function CustomerAppAuth({ customerName, correctCode, onAuthenticated, errorMessage }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const inputs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  const setDigit = (idx: number, v: string) => {
    const clean = v.replace(/[^0-9]/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = clean;
      return next;
    });
    if (clean && idx < 3) inputs.current[idx + 1]?.focus();
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

  const submit = () => {
    const pin = digits.join('');
    if (pin.length !== 4) {
      setError('4桁のコードを入力してください');
      return;
    }
    if (correctCode != null && pin !== correctCode) {
      setError('アクセスコードが一致しません');
      return;
    }
    setError(null);
    onAuthenticated(pin);
  };

  return (
    <div className="min-h-full bg-bg-card flex flex-col px-6 py-8">
      <div className="text-center mb-10 mt-4">
        <div className="font-serif text-2xl text-ink-primary tracking-wide">TOKYO LAND</div>
        <div className="font-mono text-[10px] text-ink-muted mt-1 tracking-widest">CUSTOMER PROPOSAL</div>
      </div>

      <div className="text-center mb-6">
        <div className="text-[11px] text-ink-muted tracking-widest uppercase">お客様</div>
        <div className="font-serif text-lg text-ink-primary mt-1">{customerName} 様</div>
      </div>

      <h1 className="font-serif text-base text-ink-primary text-center">アクセスコードを入力</h1>
      <p className="text-[11px] text-ink-muted text-center mt-1">
        担当者からお伝えした4桁の数字をご入力ください
      </p>

      <div className="flex justify-center gap-2 mt-6">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
              if (e.key === 'Enter') submit();
            }}
            onPaste={onPaste}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className="w-12 h-14 rounded-lg bg-bg-white border border-ink-muted/30 text-center font-mono text-2xl text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-pine/40"
          />
        ))}
      </div>

      {error && <div className="mt-4 text-xs text-center text-accent-terracotta">{error}</div>}

      <button
        onClick={submit}
        disabled={digits.join('').length !== 4}
        className="mt-6 w-full py-3 rounded-lg bg-accent-pine text-bg-white text-sm font-medium hover:bg-accent-pine/90 disabled:opacity-40"
      >
        閲覧する
      </button>

      <div className="mt-auto pt-10 text-[10px] text-center text-ink-muted">
        コードが分からない場合は担当者までお問い合わせください
      </div>
    </div>
  );
}
