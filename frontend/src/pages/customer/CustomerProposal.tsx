import { useState } from 'react';
import { fetchPublicProposal, type PublicProposalError } from '../../api/proposals';
import type { PublicProposal } from '../../api/types';
import { PinGate } from './PinGate';
import { ProposalView } from './ProposalView';

type Props = { slug: string };

export function CustomerProposal({ slug }: Props) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null);

  const submitPin = async (pin: string) => {
    try {
      const data = await fetchPublicProposal(slug, pin);
      setProposal(data);
    } catch (err) {
      const e = err as PublicProposalError;
      if (e.code === 'NOT_FOUND') throw new Error('この提案は見つかりませんでした');
      if (e.code === 'EXPIRED') throw new Error('この提案は有効期限切れです');
      if (e.code === 'PIN_MISMATCH') throw new Error('PINコードが一致しません');
      throw new Error(e.message || 'エラーが発生しました');
    }
  };

  const signOut = () => setProposal(null);

  if (!proposal) {
    return <PinGate slug={slug} onSubmit={submitPin} />;
  }
  return <ProposalView proposal={proposal} onSignOut={signOut} />;
}
