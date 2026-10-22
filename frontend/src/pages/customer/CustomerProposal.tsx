import { useEffect, useRef, useState } from 'react';
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
type HistoryState = { stage?: string; itemId?: string } | null;

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
  // 認証前の URL に付いていた #itemId（認証後にその物件の詳細を直接開く）
  const initialHashRef = useRef('');
  const listScrollYRef = useRef(0);
  const prevStageRef = useRef<Stage>('auth');

  useEffect(() => {
    initialHashRef.current = window.location.hash.slice(1);
  }, []);

  // 表示中はブラウザの自動スクロール復元を止め、アプリ側の復元と競合させない
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = 'auto';
    };
  }, []);

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

  // ブラウザの戻る/進むで一覧と詳細を切り替える（認証前は何もしない）
  useEffect(() => {
    if (!proposal) return;
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as HistoryState;
      const itemId = state?.itemId;
      if (state?.stage === 'detail' && itemId && proposal.items.some((i) => i.id === itemId)) {
        setSelectedItemId(itemId);
        setStage('detail');
      } else {
        setStage('list');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [proposal]);

  // 詳細は先頭から表示し、詳細→一覧に戻ったら一覧のスクロール位置を復元する
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = stage;
    if (stage === 'detail') {
      window.scrollTo(0, 0);
      return;
    }
    if (stage === 'list' && prev === 'detail') {
      const raf = window.requestAnimationFrame(() => window.scrollTo(0, listScrollYRef.current));
      return () => window.cancelAnimationFrame(raf);
    }
  }, [stage]);

  const onAuthenticated = async (code: string) => {
    // 毎回 null に戻してから再設定し、同じメッセージの連続失敗でも子の useEffect を発火させる
    setAuthError(null);
    setSubmitting(true);
    try {
      const data = await fetchPublicProposal(slug, code);
      setProposal(data);
      // 現在の履歴エントリを「一覧」にし、#itemId があればその詳細を上に積む
      const { pathname } = window.location;
      window.history.replaceState({ stage: 'list' }, '', pathname);
      const itemId = initialHashRef.current;
      if (itemId && data.items.some((i) => i.id === itemId)) {
        window.history.pushState({ stage: 'detail', itemId }, '', `${pathname}#${itemId}`);
        setSelectedItemId(itemId);
        setStage('detail');
      } else {
        setStage('list');
      }
    } catch (err) {
      // code を持たないもの（fetch の TypeError 等）はサーバー未到達として日本語で案内する
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const e = err as PublicProposalError;
        setAuthError(e.message ?? '認証に失敗しました');
      } else {
        setAuthError('サーバーに接続できませんでした。少し時間をおいて、もう一度お試しください');
      }
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
              listScrollYRef.current = window.scrollY;
              window.history.pushState({ stage: 'detail', itemId: id }, '', `${window.location.pathname}#${id}`);
              setSelectedItemId(id);
              setStage('detail');
            }}
          />
        )}
        {stage === 'detail' && proposal && selectedItemId && (
          <CustomerAppDetail
            proposal={proposal}
            itemId={selectedItemId}
            // 画面の切替は popstate 側で行う
            onBack={() => window.history.back()}
          />
        )}
      </div>
    </div>
  );
}
