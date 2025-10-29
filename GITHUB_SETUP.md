# GitHubとVercelへのデプロイ手順

## 1. GitHubリポジトリの作成

### 方法1: GitHub Web UIを使用

1. [GitHub](https://github.com)にログイン
2. 右上の「+」ボタンから「New repository」を選択
3. リポジトリ名を入力（例: `study-planner`）
4. 「Public」または「Private」を選択
5. **「Initialize this repository with a README」のチェックを外す**（既にローカルにコミットがあるため）
6. 「Create repository」をクリック

### 方法2: GitHub CLIを使用（推奨）

```bash
# GitHub CLIがインストールされている場合
gh repo create study-planner --public --source=. --remote=origin --push
```

### 手動でリモートを追加する場合

GitHubリポジトリを作成後、以下のコマンドを実行：

```bash
# リモートリポジトリを追加（<your-username>をあなたのGitHubユーザー名に置き換え）
git remote add origin https://github.com/<your-username>/study-planner.git

# またはSSHを使用する場合
git remote add origin git@github.com:<your-username>/study-planner.git

# プッシュ
git branch -M main
git push -u origin main
```

## 2. Vercelへのデプロイ

### 方法1: Vercel Web UIを使用（推奨）

1. [Vercel](https://vercel.com)にログイン（GitHubアカウントでログイン推奨）
2. 「Add New Project」をクリック
3. 先ほど作成したGitHubリポジトリをインポート
4. プロジェクト設定：
   - **Framework Preset**: Next.js（自動検出される）
   - **Root Directory**: `./`（プロジェクトルート）
   - **Build Command**: `npm run build`（自動）
   - **Output Directory**: `.next`（自動）
5. 「Environment Variables」セクションで以下の環境変数を追加：
   ```
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=your-production-secret-key（ランダムな長い文字列）
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DATABASE_URL=your-vercel-postgres-connection-string
   TZ=Asia/Tokyo
   ```
6. 「Deploy」をクリック

### 方法2: Vercel CLIを使用

```bash
# Vercel CLIをインストール（まだの場合）
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

## 3. データベースの設定（Vercel Postgres）

1. Vercelダッシュボードでプロジェクトを開く
2. 「Storage」タブをクリック
3. 「Create Database」→「Postgres」を選択
4. データベース名を入力（例: `study-planner-db`）
5. リージョンを選択：
   - 利用可能なリージョンから選択（例: `Tokyo`、`Tokyo (Japan)`、またはデフォルトのリージョン）
   - リージョンが表示されない場合は、デフォルトのリージョンを使用
6. データベース作成後、「.env.local」タブの接続文字列をコピー
7. プロジェクトの「Settings」→「Environment Variables」で`DATABASE_URL`を設定
8. マイグレーションを実行：
   ```bash
   # ローカルから実行（.env.localにVercel Postgresの接続文字列を設定）
   npx prisma migrate deploy
   ```

## 4. Google OAuth設定の更新

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. OAuth 2.0 クライアントIDを編集
5. 「承認済みのリダイレクトURI」に以下を追加：
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```
6. 「保存」をクリック

## 5. 本番環境の確認

デプロイ後、以下を確認：

1. Vercelから提供されるURLにアクセス
2. Googleログインが動作することを確認
3. 各機能が正常に動作することを確認
4. Googleカレンダーに「Study Planner」カレンダーが作成されることを確認

## トラブルシューティング

### デプロイエラー

- ビルドログを確認してエラー内容を確認
- 環境変数が正しく設定されているか確認
- `npx prisma generate`を実行してPrismaクライアントを生成

### データベース接続エラー

- `DATABASE_URL`が正しく設定されているか確認
- Vercel Postgresのステータスを確認
- マイグレーションが実行されているか確認

### Google OAuthエラー

- リダイレクトURIが正しく設定されているか確認
- 環境変数`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しいか確認
- `NEXTAUTH_URL`が本番環境のURLと一致しているか確認


