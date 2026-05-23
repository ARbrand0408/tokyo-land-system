import { useState, type FormEvent } from 'react';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import { setSession } from '../lib/auth';

type Props = {
  onLoggedIn?: () => void;
};

export function Login({ onLoggedIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      setSession(res.data.token, res.data.user);
      onLoggedIn?.();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'ログインに失敗しました';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-md bg-bg-card rounded-lg border border-ink-muted/15 shadow-sm p-10">
        <div className="text-center mb-8">
          <div className="font-serif text-3xl text-ink-primary tracking-wide">TOKYO LAND</div>
          <div className="font-mono text-[10px] text-ink-muted mt-2 tracking-widest">
            CUSTOMER MGMT v0.2
          </div>
          <div className="text-sm text-ink-secondary mt-6">管理画面にログイン</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">メールアドレス</label>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-white border border-ink-muted/30 rounded text-sm text-ink-primary focus:outline-none focus:border-accent-pine"
              placeholder="admin@tokyo-land.com"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">パスワード</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-white border border-ink-muted/30 rounded text-sm text-ink-primary focus:outline-none focus:border-accent-pine"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-accent-terracotta bg-accent-terracotta/10 border border-accent-terracotta/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent-pine text-bg-card rounded font-medium text-sm hover:bg-accent-forest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
