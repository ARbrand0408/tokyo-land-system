import { lazy, Suspense, useEffect, useState } from 'react';
import { CustomerProposal } from './pages/customer/CustomerProposal';

// 管理画面は別チャンクに分け、顧客ページ (/p/xxx) では読み込まない
const AdminApp = lazy(() => import('./AdminApp'));

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // お客様向け提案ページ (/p/xxx) は認証不要。
  const customerMatch = path.match(/^\/p\/([A-Za-z0-9_-]+)\/?$/);
  if (customerMatch && customerMatch[1]) {
    return <CustomerProposal slug={customerMatch[1]} />;
  }

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-bg-base text-ink-muted text-sm">読み込み中...</div>
      }
    >
      <AdminApp path={path} />
    </Suspense>
  );
}

export default App;
