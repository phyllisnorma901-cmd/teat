# 希望休提出アプリ (MVP)

Next.js (App Router)・TypeScript・Prisma・PostgreSQL・Tailwind (shadcn/ui 風コンポーネント) で構築した希望休管理アプリの最小実用構成です。従業員の希望休申請、管理者の承認フロー、スケジューラ向け読み取り API を備えています。Docker Compose で起動できます。

## 主な機能

- **メールリンク風ログイン**: 登録済みメールを入力すると即ログイン（JWT クッキー）。
- **従業員画面 `/request`**: 日付・種類・重み・理由を入力して申請。送信後にトースト通知と履歴テーブル表示。
- **管理画面 `/admin`**:
  - 未承認申請の一覧と承認/却下操作
  - 週表示カレンダーで承認/保留状況を俯瞰
  - 最新の申請一覧
- **API**:
  - `POST /api/timeoff` 希望休申請（重複・期間・締切バリデーション）
  - `GET /api/timeoff?mine=true` 自分の申請一覧
  - `GET /api/admin/timeoff?status=PENDING` 管理者用キュー
  - `PATCH /api/admin/timeoff/:id` ステータス更新
  - `GET /api/scheduler/timeoff?from=YYYY-MM-DD&to=YYYY-MM-DD` 承認済み申請の読み取り
- **バリデーション**: Zod + サーバ側チェック（日付、最大30日、重複禁止、任意の締切）。
- **ユニットテスト**: Prisma クライアントをモックしたサービス層テスト（Jest）。

## ディレクトリ構成ハイライト

```
app/                    Next.js App Router ルート
  (auth)/login          ログインページ
  (dashboard)/request   従業員向けフォームと履歴
  (dashboard)/admin     管理者 UI（未承認/週ビュー/一覧）
  api/                  Route Handlers（REST API）
components/ui/          shadcn/ui 風の再利用コンポーネント
lib/                    Prisma クライアント・認証・日付ヘルパ・サービス
prisma/schema.prisma    データモデル
prisma/seed.ts          管理者と従業員・サンプル申請の投入
__tests__/              Jest テスト
```

## 必要な環境変数

`.env.example` を参考に `.env` を作成してください。

| 変数名 | 説明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 接続文字列（例: `postgresql://postgres:postgres@localhost:5432/timeoff?schema=public`） |
| `AUTH_SECRET` | JWT 署名キー（ログイン用） |
| `SCHEDULER_API_TOKEN` | スケジューラ読み取り API 用の共有トークン |
| `REQUEST_DEADLINE_WEEKDAY` | 希望休締切の曜日 (0=日曜〜6=土曜)。省略時は締切なし |
| `REQUEST_DEADLINE_HOUR` | 締切の時刻 (0〜23)。上とセットで指定 |

## セットアップ手順

```bash
npm install
npm run db:generate        # Prisma Client 生成
npm run db:push            # スキーマをDBに適用
npm run seed               # 管理者/従業員/申請データを投入
npm run dev                # http://localhost:3000 で開発サーバ起動
```

### ログイン用サンプルユーザー

- 管理者: `admin@example.com`
- 従業員: `alice@example.com`, `bob@example.com`, `charlie@example.com`

## Docker での起動

```bash
cp .env.example .env
docker-compose up --build
```

- Web: http://localhost:3000
- DB: localhost:5432 (ユーザー/パスワード `postgres`)
- 初回起動時は `npx prisma migrate deploy` が自動実行されます。

## テスト

```bash
npm test
```

サービス層のユースケース（正常/異常、認可エラーなど）をカバーしています。

## 補足

- `/api/scheduler/timeoff` は Bearer トークン（`Authorization: Bearer <SCHEDULER_API_TOKEN>`）または管理者ログインでアクセス可能です。
- 週表示カレンダーでは承認済みを緑、保留をグレーで表示します。
- shadcn/ui のデザインを参考にした Tailwind コンポーネントを用意し、アクセシビリティ (aria 属性・フォーカスリング) に配慮しています。
