import { useState } from 'react';
import { CustomersList } from './CustomersList';
import { CustomerDetail } from './CustomerDetail';

type View = { mode: 'list' } | { mode: 'detail'; id: string };

export function CustomersView() {
  const [view, setView] = useState<View>({ mode: 'list' });

  if (view.mode === 'detail') {
    return (
      <CustomerDetail
        customerId={view.id}
        onBack={() => setView({ mode: 'list' })}
        onDeleted={() => setView({ mode: 'list' })}
      />
    );
  }
  return <CustomersList onSelect={(id) => setView({ mode: 'detail', id })} />;
}
