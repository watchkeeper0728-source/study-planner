# 認証問題のトラブルシューティング手順

## 問題の現状

- ログイン後、メイン画面に遷移しない
- `/auth/error`にも遷移しない
- `getUserByAccount`、`linkAccount`、`createSession`のログが表示されない
- `getUserByEmail`のログは表示される

## 根本原因の可能性

NextAuthが既存ユーザーに対してアカウントをリンクする処理を実行していない可能性があります。

## 解決手順

### ステップ1: ユーザーデータを完全にリセット

以下のエンドポイントを呼び出して、ユーザーと全ての関連データを削除：

```bash
curl -X POST https://project-omega-weld.vercel.app/api/debug/full-reset
```

または、ブラウザで以下のURLにアクセス：
```
https://project-omega-weld.vercel.app/api/debug/full-reset
```

**注意**: この操作は全てのユーザーデータを削除します。

### ステップ2: 新規ユーザーとしてログイン

1. ブラウザで以下にアクセス：
   ```
   https://project-omega-weld.vercel.app/auth/signin
   ```

2. 「Googleでログイン」をクリック

3. 新規ユーザーとして作成されるはずです

### ステップ3: データベースの状態を確認

以下のエンドポイントで状態を確認：
```
https://project-omega-weld.vercel.app/api/debug/db
```

期待される結果：
- `accounts: 1` - Googleアカウントがリンクされている
- `sessions: 1` - セッションが作成されている

### ステップ4: OAuthフローのテスト

以下のエンドポイントでOAuthフローの状態を確認：
```
https://project-omega-weld.vercel.app/api/debug/test-oauth-flow
```

## 別のアプローチ: NextAuthの設定を見直す

既存ユーザーに対してアカウントをリンクする処理が実行されない場合は、以下の設定を確認：

1. `signIn`コールバックが`true`を返しているか確認
2. PrismaAdapterが正しく動作しているか確認
3. データベーススキーマが正しいか確認（特に`refresh_token_expires_in`フィールド）

## デバッグ用エンドポイント

- `/api/debug/db` - データベースの状態を確認
- `/api/debug/full-reset` - ユーザーと全ての関連データを削除
- `/api/debug/clear-accounts` - アカウントとセッションを削除
- `/api/debug/reset-user` - ユーザーを削除
- `/api/debug/test-oauth-flow` - OAuthフローの状態を確認

