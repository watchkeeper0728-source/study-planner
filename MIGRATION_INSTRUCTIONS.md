# 過去問機能のマイグレーション手順

過去問機能を使用するために、以下の手順でデータベースマイグレーションを実行してください。

## 手順

1. 開発サーバーを停止（Ctrl+C）

2. マイグレーションファイルを作成・実行：
```bash
npx prisma migrate dev --name add_past_exams
```

3. Prismaクライアントを再生成：
```bash
npx prisma generate
```

4. 開発サーバーを再起動：
```bash
npm run dev
```

これで過去問機能が使用できるようになります。

