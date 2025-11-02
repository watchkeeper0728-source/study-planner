# 本番環境への移行ガイド

## 1. Google OAuth設定の更新

### 1.1 OAuth同意画面の公開

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト「study-planner」を選択
3. 「APIとサービス」→「OAuth同意画面」を開く
4. 「公開ステータス」を確認：
   - 「テスト中」の場合：**「公開」に変更**
   - これにより、すべてのGoogleユーザーがログイン可能になります

### 1.2 テストユーザーの削除（任意）

テストユーザーリストから削除すると、すべてのユーザーがログイン可能になります：

1. 「OAuth同意画面」の「テストユーザー」セクションを確認
2. テストユーザーを削除するか、そのまま残すことも可能
3. 公開状態であれば、テストユーザーリストの有無に関わらず、すべてのユーザーがログイン可能です

### 1.3 承認済みリダイレクトURIの確認

以下のURIが「承認済みリダイレクトURI」に登録されていることを確認：

- `https://project-omega-weld.vercel.app/api/auth/callback/google`

必要に応じて、カスタムドメインを使用する場合は、そのドメインも追加してください。

## 2. 環境変数の確認

### 2.1 重要な注意事項

**⚠️ ログイン画面で別のアプリ名（例: "folder-rules-sync"）が表示される場合**

これは、`GOOGLE_CLIENT_ID`環境変数が誤ったプロジェクトのOAuth Client IDに設定されている可能性があります。

**正しいOAuth Client IDの形式:**
- 先頭が `259584654504-h86ohpa6trnsif0falig3qssg55r7aap` で始まる
- Google Cloud Consoleの「study-planner」プロジェクトから取得したもの

**確認方法:**

1. 以下のエンドポイントで現在の設定を確認（一時的にデバッグモードを有効化）：
   ```
   https://project-omega-weld.vercel.app/api/auth/verify-config
   ```
   ※ デバッグモードが無効な場合は、Vercelの環境変数で `ENABLE_AUTH_DEBUG=true` を設定

2. Vercelダッシュボードで `GOOGLE_CLIENT_ID` を確認：
   - 「study-planner」プロジェクトのOAuth Client IDであることを確認
   - 誤った場合は、Google Cloud Consoleから正しいClient IDを取得して更新

### 2.2 必要な環境変数

Vercelダッシュボードで以下の環境変数が正しく設定されていることを確認：

- `GOOGLE_CLIENT_ID` - Google OAuth Client ID（**「study-planner」プロジェクトのもの**）
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret（**「study-planner」プロジェクトのもの**）
- `NEXTAUTH_URL` - 本番URL（例: `https://project-omega-weld.vercel.app`）
- `NEXTAUTH_SECRET` - NextAuth用の秘密鍵
- `DATABASE_URL` - PostgreSQLデータベースURL
- `TZ` - タイムゾーン（例: `Asia/Tokyo`）

### 2.3 正しいOAuth Client IDの取得方法

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. **「study-planner」プロジェクト**を選択（重要）
3. 「APIとサービス」→「認証情報」を開く
4. 「OAuth 2.0 クライアントID」セクションを確認
5. 正しいClient IDをコピー（先頭が `259584654504-h86ohpa6trnsif0falig3qssg55r7aap` で始まる）
6. Vercelダッシュボードで `GOOGLE_CLIENT_ID` 環境変数を更新

## 3. セキュリティ設定

### 3.1 デバッグエンドポイントの削除

✅ **完了済み**: デバッグエンドポイント（`/api/debug/*`）は削除されました

### 3.2 デバッグログの無効化

✅ **完了済み**: 本番環境ではデバッグログが自動的に無効化されます

環境変数 `ENABLE_AUTH_DEBUG=true` を設定することで、必要に応じてデバッグログを有効化できます（トラブルシューティング時のみ使用）

## 4. データベースの準備

### 4.1 マイグレーションの確認

以下のマイグレーションが適用されていることを確認：

- `refresh_token_expires_in` フィールドが `Account` モデルに追加されている

### 4.2 データベースバックアップ

本番環境に移行する前に、既存データのバックアップを推奨：

```bash
# データベースのバックアップ（Prisma Accelerateを使用している場合）
# Vercelダッシュボードからデータベースのバックアップを取得
```

## 5. 動作確認チェックリスト

本番環境に移行後、以下を確認：

- [ ] 新しいGoogleアカウントでログインできる
- [ ] ユーザー情報が正しく表示される
- [ ] セッションが正しく維持される
- [ ] ログアウトが正常に動作する
- [ ] データの作成・更新・削除が正常に動作する

## 6. トラブルシューティング

### 6.1 ログインできない場合

1. Google Cloud ConsoleでOAuth同意画面が「公開」になっているか確認
2. リダイレクトURIが正しく設定されているか確認
3. Vercelのログでエラーを確認

### 6.2 デバッグログを有効化する場合

Vercelの環境変数に以下を追加：

```
ENABLE_AUTH_DEBUG=true
```

**注意**: デバッグログを有効化すると、ログに機密情報が表示される可能性があります。トラブルシューティングが完了したら、必ず無効化してください。

## 7. モニタリング

本番環境では、以下を監視してください：

- エラーログの監視（Vercel Dashboard）
- データベース接続の監視
- 認証エラーの監視

## 8. サポート

問題が発生した場合：

1. Vercelのログを確認
2. Google Cloud ConsoleのOAuth設定を確認
3. データベースの状態を確認（Prisma Studioなど）

