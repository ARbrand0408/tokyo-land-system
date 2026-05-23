import type { AuthUser } from '../lib/auth';

type ViewKey = 'dashboard' | 'properties' | 'customers';

type NavItem = {
  key: ViewKey;
  label: string;
  description: string;
  icon: string;
};

const items: NavItem[] = [
  { key: 'dashboard', label: 'ダッシュボード', description: 'KPI / 最近の提案', icon: '◐' },
  { key: 'properties', label: '物件マスター', description: '物件登録・編集', icon: '◇' },
  { key: 'customers', label: '顧客・提案管理', description: '顧客と提案物件', icon: '◈' },
];

type Props = {
  active: ViewKey;
  onChange: (key: ViewKey) => void;
  user: AuthUser;
  onLogout: () => void;
};

// 名前から先頭文字を取得 (日本語名は姓の1文字目を、英字は1文字目を)
function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return Array.from(trimmed)[0] ?? '?';
}

export function Sidebar({ active, onChange, user, onLogout }: Props) {
  return (
    <aside className="w-64 shrink-0 bg-bg-card border-r border-ink-muted/15 flex flex-col">
      <div className="px-6 pt-8 pb-10 border-b border-ink-muted/15">
        <div className="font-serif text-2xl text-ink-primary tracking-wide">TOKYO LAND</div>
        <div className="font-mono text-[10px] text-ink-muted mt-1 tracking-widest">
          CUSTOMER MGMT v0.2
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={[
                'w-full text-left px-4 py-3 rounded-md transition-colors flex items-start gap-3',
                isActive
                  ? 'bg-accent-pine/10 text-ink-primary'
                  : 'text-ink-secondary hover:bg-bg-base/60 hover:text-ink-primary',
              ].join(' ')}
            >
              <span
                className={[
                  'text-lg leading-none mt-0.5',
                  isActive ? 'text-accent-pine' : 'text-ink-muted',
                ].join(' ')}
              >
                {item.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-sm">{item.label}</span>
                <span className="text-[11px] text-ink-muted mt-0.5">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-ink-muted/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-terracotta/20 flex items-center justify-center font-serif text-accent-terracotta">
            {initialOf(user.name)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-ink-primary truncate">{user.name}</span>
            <span className="text-[11px] text-ink-muted truncate">{user.email}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full text-[11px] text-ink-secondary hover:text-ink-primary border border-ink-muted/30 hover:border-ink-muted/60 rounded py-1.5 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}

export type { ViewKey };
