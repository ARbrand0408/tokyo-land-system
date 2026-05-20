import { useEffect, useState } from 'react';
import { Sidebar, type ViewKey } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { ProposalEditor } from './pages/ProposalEditor';
import { CustomerProposal } from './pages/customer/CustomerProposal';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // お客様専用ページ: /p/:slug
  const customerMatch = path.match(/^\/p\/([A-Za-z0-9_-]+)\/?$/);
  if (customerMatch && customerMatch[1]) {
    return <CustomerProposal slug={customerMatch[1]} />;
  }

  // 担当者用 (デフォルト)
  return <AdminApp />;
}

function AdminApp() {
  const [view, setView] = useState<ViewKey>('dashboard');

  return (
    <div className="flex h-full bg-bg-base text-ink-primary">
      <Sidebar active={view} onChange={setView} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {view === 'dashboard' && <Dashboard />}
          {view === 'properties' && <Properties />}
          {view === 'proposal' && <ProposalEditor />}
        </div>
      </main>
    </div>
  );
}

export default App;
