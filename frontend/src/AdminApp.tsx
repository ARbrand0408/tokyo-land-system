import { useEffect, useState } from 'react';
import { Sidebar, type ViewKey } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { CustomersView } from './pages/customers/CustomersView';
import { Login } from './pages/Login';
import { clearSession, getToken, getUser, onAuthChange, type AuthUser } from './lib/auth';
import { fetchMe } from './api/auth';

function AdminApp({ path }: { path: string }) {
  // ログイン状態。初回マウント時に localStorage を読みに行く。
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getUser() : null));
  const [bootstrapping, setBootstrapping] = useState<boolean>(() => Boolean(getToken()));
  const [view, setView] = useState<ViewKey>('dashboard');

  // localStorage 変化 (ログイン/ログアウト、他タブ) を購読
  useEffect(() => {
    return onAuthChange(() => {
      setUser(getToken() ? getUser() : null);
    });
  }, []);

  // 既存トークンがあれば /api/auth/me で有効性を確認して最新ユーザー情報に更新
  useEffect(() => {
    if (!getToken()) {
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((res) => {
        if (cancelled) return;
        // localStorage を最新の name/role で更新
        const next = res.data;
        const token = getToken();
        if (token) {
          localStorage.setItem('tokyo_land_admin_user', JSON.stringify(next));
          setUser(next);
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // /login にいるときはブートストラップ完了を待たずにログイン画面を出す。
  // (401 を受けて遷移してきた直後のチラ見え防止)
  if (path === '/login') {
    return (
      <Login
        onLoggedIn={() => {
          // ログイン成功後はトップに戻す。
          window.history.replaceState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      />
    );
  }

  if (bootstrapping) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-base text-ink-muted text-sm">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-full bg-bg-base text-ink-primary">
      <Sidebar
        active={view}
        onChange={setView}
        user={user}
        onLogout={() => {
          clearSession();
          setView('dashboard');
        }}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {view === 'dashboard' && (
            <Dashboard onJumpToCustomers={() => setView('customers')} />
          )}
          {view === 'properties' && <Properties />}
          {view === 'customers' && <CustomersView />}
        </div>
      </main>
    </div>
  );
}

export default AdminApp;
