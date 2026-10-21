# TOKYO LAND 顧客提案システム

## 構成
- frontend/: Vite + React 19 + TypeScript + Tailwind 3 → Vercel（自動デプロイ）
- backend/: Hono + Prisma 5 → Render（自動デプロイ、Free プラン）。DB は Neon、画像は Cloudinary
- ルーティングは React Router 不使用。frontend/src/App.tsx が pathname を正規表現判定
  - /p/:slug → 顧客向け提案ページ（frontend/src/pages/customer/）
  - それ以外 → 管理画面（JWT ログイン）

## 顧客向け画面の構造
- CustomerProposal.tsx（親、stage: loading→auth→list→detail）
- CustomerAppAuth.tsx（4桁PIN）/ CustomerAppList.tsx（一覧）/ CustomerAppDetail.tsx（詳細）
- 上記3コンポーネントは管理画面の ProposalPreview.tsx（IOSFrame 内）でも共用されている。
  顧客画面を変更したら、必ず管理画面の「プレビュー」でも表示確認すること。
- 顧客向け API: backend/src/routes/publicProposals.ts（/api/p/:slug/meta は認証なし、/api/p/:slug は X-Access-Code ヘッダ）

## 開発コマンド
- backend: cd backend && npm run dev（PORT 3001）/ npm run build（prisma generate + tsc）
- frontend: cd frontend && npm run dev（5173）/ npm run build（tsc -b + vite build）
- frontend/.env の VITE_API_URL=http://localhost:3001（本番は Vercel の環境変数）

## 作業ルール（このプロジェクトでの約束）
1. 1タスク = 1コミット。指示されたタスク以外の変更（リファクタ、整形、無関係な修正）はしない。
2. 変更前に対象ファイルを読み、変更後は `npm run build` が通ることを確認してから報告する（frontend は tsc -b を含むので型エラーも検出できる）。
3. 報告は「変更ファイル一覧／変更内容の要約／ビルド結果／確認してほしい操作」の4点を簡潔に。
4. 依存パッケージの追加は、指示に明記がない限り行わない（必要なら提案して止まる）。
5. git push は指示があったときだけ行う。
6. コミットメッセージは日本語、prefix は feat / fix / perf / docs / chore。

## デザイントークン（tailwind.config.js）
- 背景 bg-bg-base #E8E5DD / カード bg-bg-card #FAF9F5 / 文字 ink-primary #1F1E1A / ink-muted #8A867E
- アクセント accent-pine #306748（主ボタン）/ accent-terracotta #B0573A（エラー・♥）
- フォント font-serif（Noto Serif JP: 見出し）/ font-sans（Noto Sans JP: 本文）/ font-mono（JetBrains Mono: ラベル）
- 新しい色・フォントを追加しない。既存トークンのみ使う。
