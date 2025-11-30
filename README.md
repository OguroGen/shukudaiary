# しゅくだいありー (Shukudaiary)

そろばん教室向け学習日記Webサービス

## 概要

「しゅくだい（宿題）」×「ダイアリー（Diary）」

生徒の宿題や練習結果が"学習日記"として記録される、そろばん教室向けWebサービスです。

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **バックエンド/DB**: Supabase (PostgreSQL + Row Level Security)
- **認証**: Supabase Auth (先生用) + カスタム認証 (生徒用)

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクト設定 > API から以下を取得:
   - Project URL
   - anon/public key

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. データベーススキーマの作成

SupabaseダッシュボードのSQL Editorで、`supabase/migrations/001_initial_schema.sql`の内容を実行してください。

これにより以下のテーブルが作成されます:
- `schools`: 教室情報
- `teachers`: 先生情報
- `students`: 生徒情報
- `presets`: 難度プリセット
- `homeworks`: 宿題情報
- `answers`: 回答データ

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 初期設定

### 教室と先生の作成

1. Supabaseダッシュボードで以下を実行:

```sql
-- 教室を作成
INSERT INTO schools (name) VALUES ('テスト教室');

-- 先生用のSupabase Authユーザーを作成（SupabaseダッシュボードのAuthenticationから）
-- その後、teachersテーブルにレコードを追加
INSERT INTO teachers (id, school_id, email)
VALUES (
  '作成したSupabase AuthユーザーのID',
  '作成した教室のID',
  'teacher@example.com'
);
```

### 生徒の作成

先生でログイン後、生徒管理画面から生徒を追加できます。

## 機能

### 生徒側

- ログイン（login_id + password）
- ホーム画面（宿題一覧、自主練習メニュー）
- 宿題機能（開始確認 → 問題画面 → 結果画面）
- 自主練習機能（種目選択 → 問題画面 → 結果表示）
- パスワード変更

### 先生側

- ログイン（Supabase Auth）
- ダッシュボード（統計情報、メニュー）
- 生徒管理（一覧、詳細、追加、パスワードリセット）
- 宿題管理（一覧、作成、詳細表示）
- プリセット管理（一覧、作成、編集、削除）

## Freeプラン制限（MVP）

- 生徒登録: 10人まで / 1教室
- プリセット: 10件まで / 1教室
- 宿題結果・回答データの保存期間: 90日（将来対応）

## プロジェクト構造

```
app/
  student/          # 生徒側ページ
  teacher/          # 先生側ページ
  api/              # APIルート
components/         # 再利用可能なコンポーネント
lib/                # ユーティリティ関数
  auth/             # 認証関連
  problems/         # 問題生成ロジック
  supabase/         # Supabaseクライアント
  validation/       # バリデーション
types/              # TypeScript型定義
supabase/
  migrations/       # データベースマイグレーション
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
