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

type Stage = 'auth' | 'list' | 'detail';
type MetaStatus = 'loading' | 'ready' | 'notFound' | 'error';

// 実機表示 (URLからアクセス) ではiOSフレームを表示せず、画面全体を使う
export function CustomerProposal({ slug }: Props) {
  const [meta, setMeta] = useState<PublicProposalMeta | null>(null);
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [stage, setStage] = useState<Stage>('auth');
  const [metaStatus, setMetaStatus] = useState<MetaStatus>('loading');
  const [connectingHint, setConnectingHint] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // URLに ?code=xxx が付いていても自動ログインさせず、必ず4桁PIN入力を求める。
  // 古いリンクからアクセスされた場合に備えて、クエリパラメータは履歴から取り除いておく。
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }, []);

  // PIN画面は即表示し、meta はバックグラウンドで取得する（Render のスリープ復帰のウォームアップも兼ねる）
  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const load = (isRetry: boolean) => {
      fetchPublicProposalMeta(slug)
        .then((m) => {
          if (cancelled) return;
          setMeta(m);
          setMetaStatus('ready');
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if ((err as Partial<PublicProposalError> | null)?.code === 'NOT_FOUND') {
            setMetaStatus('notFound');
            return;
          }
          // ネットワークエラー等は3秒後に1回だけリトライ。再失敗でもPIN送信時に再通信するので画面は出したまま
          if (isRetry) {
            setMetaStatus('error');
            return;
          }
          retryTimer = window.setTimeout(() => load(true), 3000);
        });
    };
    load(false);
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [slug]);

  // meta の取得が2秒を超えたら「接続中」ヒントを出す
  useEffect(() => {
    if (metaStatus !== 'loading') {
      setConnectingHint(false);
      return;
    }
    const timer = window.setTimeout(() => setConnectingHint(true), 2000);
    return () => window.clearTimeout(timer);
  }, [metaStatus]);

  const onAuthenticated = async (code: string) => {
    // 毎回 null に戻してから再設定し、同じメッセージの連続失敗でも子の useEffect を発火させる
    setAuthError(null);
    setSubmitting(true);
    try {
      const data = await fetchPublicProposal(slug, code);
      setProposal(data);
      setStage('list');
    } catch (err) {
      const e = err as PublicProposalError;
      setAuthError(e.message ?? '認証に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex justify-center">
      <div className="w-full max-w-md bg-bg-card min-h-screen">
        {stage === 'auth' && (
          <CustomerAppAuth
            customerName={metaStatus === 'ready' ? meta?.customerName ?? null : null}
            notFound={metaStatus === 'notFound'}
            hint={connectingHint ? 'サーバーに接続しています…' : null}
            errorMessage={authError}
            submitting={submitting}
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
