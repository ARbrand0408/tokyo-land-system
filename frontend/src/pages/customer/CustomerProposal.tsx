import { useEffect, useState } from 'react';
import {
  fetchPublicProposal,
  fetchPublicProposalMeta,
  type PublicProposalError,
} from '../../api/proposals';
import type { PublicProposal, PublicProposalMeta } from '../../api/types';
import { CustomerAppAuth } from './CustomerAppAuth';
import { CustomerAppList } from './CustomerAppList';
import { CustomerAppDetail } from './CustomerAppDetail';

type Props = { slug: string };

type Stage = 'loading' | 'auth' | 'list' | 'detail';

// 実機表示 (URLからアクセス) ではiOSフレームを表示せず、画面全体を使う
export function CustomerProposal({ slug }: Props) {
  const params = new URLSearchParams(window.location.search);
  const initialCode = params.get('code') ?? '';

  const [meta, setMeta] = useState<PublicProposalMeta | null>(null);
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProposalMeta(slug)
      .then(async (m) => {
        setMeta(m);
        if (initialCode) {
          try {
            const data = await fetchPublicProposal(slug, initialCode);
            setProposal(data);
            setStage('list');
            return;
          } catch {
            // fall through
          }
        }
        setStage('auth');
      })
      .catch((err: PublicProposalError) => {
        setMeta(null);
        setStage('auth');
        setAuthError(err.message ?? '提案が見つかりません');
      });
  }, [slug, initialCode]);

  const onAuthenticated = async (code: string) => {
    try {
      const data = await fetchPublicProposal(slug, code);
      setProposal(data);
      setStage('list');
    } catch (err) {
      const e = err as PublicProposalError;
      setAuthError(e.message ?? '認証に失敗しました');
    }
  };

  if (stage === 'loading') {
    return <div className="min-h-screen bg-bg-base flex items-center justify-center text-ink-muted">読み込み中…</div>;
  }

  return (
    <div className="min-h-screen bg-bg-base flex justify-center">
      <div className="w-full max-w-md bg-bg-card min-h-screen">
        {stage === 'auth' && (
          <CustomerAppAuth
            customerName={meta?.customerName ?? 'お客様'}
            errorMessage={authError}
            onAuthenticated={(c) => onAuthenticated(c)}
          />
        )}
        {stage === 'list' && proposal && (
          <CustomerAppList
            proposal={proposal}
            onSelectItem={(id) => {
              setSelectedItemId(id);
              setStage('detail');
            }}
          />
        )}
        {stage === 'detail' && proposal && selectedItemId && (
          <CustomerAppDetail
            proposal={proposal}
            itemId={selectedItemId}
            onBack={() => setStage('list')}
          />
        )}
      </div>
    </div>
  );
}
