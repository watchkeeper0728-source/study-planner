# Study Planner - 中学受験学習予定・記録アプリ

中学受験生のための学習予定管理・記録アプリです。Googleカレンダーとの連携により、効率的な学習計画の立案と実績の追跡が可能です。

## 機能

### MVP機能
Category: 基本的な機能
- **Googleログイン**: NextAuthを使用した安全な認証
- **Googleカレンダー連携**: 専用カレンダーの自動作成と単方向同期
- **週間カレンダー**: FullCalendarを使用した直感的な予定管理
- **ToDo管理**: 科目別（算数・国語・理科・社会）のタスク管理
- **ドラッグ&ドロップ**: ToDoからカレンダーへの予定登録
- **勉強可能時間ハイライト**: 平日・休日のデフォルト時間表示
- **日次レビュー**: 予定と実績の比較・記録
- **学習時間グラフ**: 日/週/月単位での学習時間可視化

Category: 新機能
- **予定の完了・削除**: カレンダー上の予定をクリックして「完了」（学習記録に保存）または「削除」を選択
- **学習記録ページ**: 完了した予定を日付・時間付きで記録、日別・累計の学習時間を表示
- **テスト管理の拡張**: テストの完了・削除機能、完了したテストの反省は保持
- **四科目一括入力**: テスト結果を四科目まとめて一度に入力可能
- **印刷機能**: A4横向きで週間カレンダーを印刷

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UIコンポーネント**: shadcn/ui, Radix UI
- **認証**: NextAuth.js (Google Provider)
- **データベース**: Prisma + PostgreSQL
- **カレンダー**: FullCalendar
- **グラフ**: Recharts
- **日付処理**: date-fns
- **バリデーション**: Zod
- **通知**: Sonner

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd study-planner
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
cp env.example .env.local
```

`.env.local`の内容：

```env
# NextAuth設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth設定
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# データベース設定
DATABASE_URL=postgresql://username:password@localhost:5432/study_planner

# タイムゾーン設定
TZ=Asia/Tokyo
```

### 4. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類を「ウェブアプリケーション」に設定
6. 承認済みのリダイレクトURIに以下を追加：
   - `http://localhost:3000/api/auth/callback/google` (開発環境)
   - `https://your-domain.com/api/auth/callback/google` (本番環境)
7. クライアントIDとクライアントシークレットを取得し、環境変数に設定

### 5. データベースの設定

PostgreSQLデータベースを作成し、接続文字列を`DATABASE_URL`に設定してください。

#### ローカル開発環境の場合：

```bash
# PostgreSQLをインストール（macOS）
brew install postgresql
brew services start postgresql

# データベースを作成
createdb study_planner
```

#### Vercel Postgresを使用する場合：

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクトを作成
3. 「Storage」タブでPostgresデータベースを作成
4. 接続文字列をコピーして環境変数に設定

### 6. データベースマイグレーション

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーションの実行
npx prisma migrate dev --name init

# データベースの確認（オプション）
npx prisma studio
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認してください。

## 動作確認手順

### 1. ログイン確認
1. アプリケーションにアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントでログイン
4. ログイン後、メインページが表示されることを確認

### 2. カレンダー同期確認
1. 初回ログイン後、Googleカレンダーに「Study Planner」カレンダーが作成されることを確認
2. ToDoを作成し、カレンダーにドラッグ&ドロップ
3. Googleカレンダーに予定が同期されることを確認

### 3. ToDo管理確認
1. 「学習ToDo」タブで各科目のToDoを作成
2. 定期・固定のタイプを選択
3. 優先度と時間を設定
4. ToDoの編集・削除が正常に動作することを確認

### 4. 予定管理確認
1. ToDoをカレンダーにドラッグ&ドロップ
2. カレンダー上で予定のリサイズ・移動
3. 予定の削除
4. 勉強可能時間のハイライト表示

### 5. 日次レビュー確認
1. 「レビュー」ページにアクセス
2. 日付を選択
3. 予定から実績へのコピー機能
4. 実績の追加・編集・削除

### 6. 分析機能確認
1. 「分析」ページにアクセス
2. 日/週/月の切り替え
3. 科目別の集計表示
4. 学習時間グラフの表示

### 7. テスト管理確認
1. 「テスト」ページにアクセス
2. テストの追加（最大3件）
3. カウントダウン表示
4. テスト結果の入力
5. 反省の記録と一覧表示

## デプロイ手順（Vercel）

### 1. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を設定

### 2. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=your-vercel-postgres-connection-string
TZ=Asia/Tokyo
```

### 3. Google OAuth設定の更新

Google Cloud Consoleで承認済みのリダイレクトURIに本番URLを追加：

```
https://your-project.vercel.app/api/auth/callback/google
```

### 4. データベースの設定

1. Vercelダッシュボードの「Storage」タブでPostgresデータベースを作成
2. 接続文字列を`DATABASE_URL`環境変数に設定

### 5. デプロイ

```bash
# 本番環境へのマイグレーション
npx prisma migrate deploy

# Vercelにデプロイ
vercel --prod
```

### 6. 本番環境の動作確認

1. デプロイされたURLにアクセス
2. Googleログインが正常に動作することを確認
3. 各機能が正常に動作することを確認

## トラブルシューティング

### よくある問題

1. **Googleログインが失敗する**
   - Google Cloud Consoleの設定を確認
   - リダイレクトURIが正しく設定されているか確認
   - 環境変数が正しく設定されているか確認

2. **データベース接続エラー**
   - `DATABASE_URL`が正しく設定されているか確認
   - PostgreSQLが起動しているか確認
   - データベースが存在するか確認

3. **カレンダー同期が失敗する**
   - Google Calendar APIが有効になっているか確認
   - OAuthスコープに`https://www.googleapis.com/auth/calendar`が含まれているか確認

4. **ビルドエラー**
   - TypeScriptの型エラーを確認
   - 依存関係が正しくインストールされているか確認

### ログの確認

```bash
# 開発環境のログ
npm run dev

# 本番環境のログ（Vercel）
vercel logs
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## サポート

問題が発生した場合は、GitHubのIssuesページで報告してください。