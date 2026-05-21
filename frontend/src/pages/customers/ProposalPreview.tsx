import { useState } from 'react';
import type { Proposal } from '../../api/types';
import { IOSFrame } from '../../components/IOSFrame';
import { CustomerAppList } from '../customer/CustomerAppList';
import { CustomerAppDetail } from '../customer/CustomerAppDetail';
import { CustomerAppAuth } from '../customer/CustomerAppAuth';

type Stage = 'auth' | 'list' | 'detail';

type Props = {
  proposal: Proposal;
  customerAccessCode: string;
  onClose: () => void;
};

// 管理画面からプレビューする際: 認証から物件詳細まで一気に確認できる
export function ProposalPreview({ proposal, customerAccessCode, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('auth');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const customerName = proposal.customer.name;

  return (
    <div
      className="fixed inset-0 bg-ink-primary/50 backdrop-blur-sm flex items-center justify-center z-50 px-6 py-6"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <IOSFrame onBack={onClose}>
          {stage === 'auth' && (
            <CustomerAppAuth
              customerName={customerName}
              correctCode={customerAccessCode}
              onAuthenticated={() => setStage('list')}
            />
          )}
          {stage === 'list' && (
            <CustomerAppList
              proposal={proposal}
              onSelectItem={(id) => {
                setSelectedItemId(id);
                setStage('detail');
              }}
            />
          )}
          {stage === 'detail' && selectedItemId && (
            <CustomerAppDetail
              proposal={proposal}
              itemId={selectedItemId}
              onBack={() => setStage('list')}
            />
          )}
        </IOSFrame>
        <div className="text-[11px] text-bg-card/80">
          顧客視点でのプレビュー (アクセスコード: {customerAccessCode})
        </div>
      </div>
    </div>
  );
}
