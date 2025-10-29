# デプロイ手順

## 1. データベースマイグレーションの実行

まず、ローカル環境でマイグレーションを実行してください：

```bash
npx prisma migrate dev --name add_past_exams
npx prisma generate
```

## 2. GitHubへのプッシュ

### 2.1 GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名を入力（例: `study-planner`）
4. PublicまたはPrivateを選択
5. 「Create repository」をクリック

### 2.2 ローカルからプッシュ

```bash
git add .
git commit -m "Initial commit: Study Planner MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 3. Vercelへのデプロイ

### 3.1 Vercelアカウントを作成・ログイン

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」→ GitHubアカウントでログイン
3. GitHubリポジトリをインポート

### 3.2 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=your-production-database-url
TZ=Asia/Tokyo
```

**重要**: `NEXTAUTH_SECRET`は以下のコマンドで生成できます：
```bash
openssl rand -base64 32
```

### 3.3 ビルド設定

Vercelのビルドコマンド：
```
npm run build
```

### 3.4 データベースの設定

1. Vercelダッシュボードの「Storage」タブでPostgresデータベースを作成
2. 接続文字列を`DATABASE_URL`環境変数に設定
3. マイグレーションを実行：
   ```bash
   npx prisma migrate deploy
   ```

### 3.5 Google OAuth設定の更新

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 認証情報ページを開く
3. OAuth 2.0 クライアントIDを編集
4. 承認済みのリダイレクトURIに追加：
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```
5. 承認済みのJavaScript生成元に追加：
   ```
   https://your-project.vercel.app
   ```

## 4. デプロイの確認

1. Vercelダッシュボードでデプロイが完了するのを待つ
2. 提供されたURLにアクセス
3. Googleログインが正常に動作することを確認
4. 各機能が正常に動作することを確認

## トラブルシューティング

### マイグレーションエラー

Vercelのデプロイログでマイグレーションエラーが出る場合：

1. Vercelダッシュボードの「Functions」タブを確認
2. データベース接続文字列が正しいか確認
3. 必要に応じて手動でマイグレーションを実行

### 環境変数の確認

`.env.local`の内容をVercelの環境変数に設定しているか確認してください。

## 次のステップ

- カスタムドメインの設定（オプション）
- 本番環境での動作確認
- パフォーマンスの最適化

