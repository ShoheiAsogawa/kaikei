# 社会福祉法人会計ソフト

社会福祉法人泉州福祉会 / 認定こども園ひさほ保育園向けの会計台帳です。

## 運用イメージ

- GitHubでコード管理
- GitHub Pagesでブラウザ公開
- Firebase Firestoreを設定した場合はDBへ同期
- Firebase未設定の場合は従来どおりブラウザのlocalStorageで運用
- push後はGitHub Actionsで自動ビルド、自動反映

## ローカル起動

```powershell
npm install
npm run dev -- --port 5173
```

ブラウザで `http://127.0.0.1:5173` を開きます。

## Firebase設定

`.env.example` を参考に `.env.local` を作成します。

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_COLLECTION=accounting_ledgers
VITE_FIREBASE_DOCUMENT_ID=senshu-hisaho-main
```

Firestoreには `firestore.rules` を適用してください。Firebase Authenticationで Email/Password provider を有効にし、利用者を作成します。

`firestore.rules` の `replace-with-authorized-user@example.com` は、利用を許可するメールアドレスへ置き換えてください。複数人で使う場合は配列にメールアドレスを追加します。

## GitHub Pages自動反映

`.github/workflows/deploy.yml` を追加済みです。GitHub側で以下を設定してください。

- Pages source: GitHub Actions
- Secrets:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - 任意: `VITE_FIREBASE_COLLECTION`
  - 任意: `VITE_FIREBASE_DOCUMENT_ID`

`main` ブランチにpushすると、`npm run verify` と `npm run build` が通ったあと公開されます。

## 検証

```powershell
npm run verify
npm run build
```

`verify` は会計ロジック、復元データ正規化、固定資産、予算、年度外仕訳などを実行型で検証します。
