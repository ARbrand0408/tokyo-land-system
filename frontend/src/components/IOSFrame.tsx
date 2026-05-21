import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onBack?: () => void;
};

// iPhone風のフレーム表示。管理画面からのプレビュー専用。
export function IOSFrame({ children, onBack }: Props) {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');

  return (
    <div className="relative">
      <div className="w-[390px] h-[844px] bg-ink-primary rounded-[55px] p-[10px] shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
        <div className="w-full h-full bg-bg-card rounded-[46px] overflow-hidden relative">
          {/* ステータスバー */}
          <div className="absolute top-0 left-0 right-0 h-12 px-7 flex items-center justify-between text-[13px] font-medium text-ink-primary z-30 pointer-events-none">
            <span className="font-mono">{hh}:{mm}</span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <span>●●●●●</span>
              <span>Wi-Fi</span>
              <span className="font-mono">100%</span>
            </span>
          </div>

          {/* ダイナミックアイランド */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-ink-primary rounded-full z-40 pointer-events-none" />

          {/* コンテンツ (ステータスバーを避ける) */}
          <div className="absolute top-12 left-0 right-0 bottom-0 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-bg-card text-ink-primary text-xl shadow-md hover:bg-bg-base"
          title="管理画面に戻る"
        >
          ×
        </button>
      )}
    </div>
  );
}
