// 管理画面用の認証状態。
// JWT は localStorage に保存して再読込時にも維持する。
// 状態変化は同一タブ内ではカスタムイベントで通知する。

const TOKEN_KEY = 'tokyo_land_admin_token';
const USER_KEY = 'tokyo_land_admin_user';
const CHANGE_EVENT = 'tokyo-land-auth-change';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onAuthChange(handler: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler); // 他タブからの変化も拾う
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

// 401 を受け取った時に呼ぶ。セッションを破棄して /login へ強制遷移する。
// すでに /login or 顧客向けページにいる場合は遷移しない (ループ防止)。
export function redirectToLogin(): void {
  clearSession();
  const path = window.location.pathname;
  if (path === '/login') return;
  // 顧客向け公開ページ (/p/xxx) は管理者ログインを要求しない
  if (path.startsWith('/p/')) return;
  // pushState + popstate で SPA 内遷移として扱う
  window.history.pushState({}, '', '/login');
  window.dispatchEvent(new PopStateEvent('popstate'));
}
