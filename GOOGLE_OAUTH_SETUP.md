# Google OAuth 2.0 設定チェックリスト

## Google Cloud Console の設定確認

1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択
3. 「APIとサービス」 → 「認証情報」に移動
4. クライアントID `259584654504-qsm1qb2arkjhrgkbgiqaqn7p5vjvmvj1.apps.googleusercontent.com` をクリック

### 設定必須項目

#### 承認済みのリダイレクトURI
以下のURIを追加：
```
http://localhost:3000/api/auth/callback/google
```

#### 承認済みのJavaScriptの生成元
以下のURLを追加：
```
http://localhost:3000
```

### 現在のエラー解決方法

403エラー「access_denied」の原因：

1. **Google Calendar APIが無効化されている**
   - 「APIとサービス」 → 「有効なAPI」で
   - Google Calendar APIが有効になっているか確認
   - 無効の場合は有効化する

2. **スコープの制限**
   - 現在はカレンダースコープを削除しました
   - 基本ログインのみで動作するように変更済み
   - カレンダー機能が必要な場合は後で追加可能

3. **OAuth同意画面の設定**
   - 「OAuth同意画面」で
   - アプリ名を設定
   - 「公開する範囲をテストユーザーに制限する」または「一般公開」を選択

### 動作確認

設定完了後、以下を試してください：

1. ブラウザをリロード
2. Googleログインボタンをクリック
3. Google認証が正常に完了することを確認

### Google Calendar機能が必要な場合

後でカレンダー機能を追加する場合は：

1. Google Cloud Consoleで「Google Calendar API」を有効化
2. 再度次の設定に変更：
   ```typescript
   scope: "openid email profile https://www.googleapis.com/auth/calendar"
   access_type: "offline"
   ```




