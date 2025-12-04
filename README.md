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

## プラン体系

現在はMVP段階のため、生徒数とプリセット数の制限のみ実装されています。プラン切り替え機能は実装済みです。

### 🆓 Free（MVP）
- 生徒: 10人まで
- プリセット: 10件まで
- 結果保存: 90日（将来対応）
- 新規教室が使い始めやすい

### 🔰 Basic ¥3,000（将来実装予定）
- 生徒: 30人まで
- プリセット: 30件まで
- 結果保存: 1年
- CSV出力
- 小規模教室のメイン

### 🏫 Standard ¥5,000（将来実装予定）
- 生徒: 100人まで
- プリセット: 100件まで
- 結果保存: 無期限
- 弱点分析
- 中規模教室の本命

### 👑 Premium ¥9,800（将来実装予定）
- 生徒: 無制限
- プリセット: 無制限
- 結果保存: 無期限
- PDF帳票・一括出題・ホワイトラベル
- 大規模向け

### プラン管理

プラン情報は`lib/plans.js`で定義されており、データベースの`schools`テーブルの`plan_type`カラムで管理されます。デフォルトは`free`プランです。

プランを変更する場合は、Supabaseダッシュボードで`schools`テーブルの`plan_type`カラムを更新してください。

**注意**: 現在の実装では、ダウングレード時に既存データ（生徒数やプリセット数）が新しいプランの制限を超えていても、そのまま保持されます。新しい追加のみが制限されます。

#### 将来の実装予定

**プラン変更時の制限チェック機能**

ダウングレード時に制限を満たしていない場合、プラン変更を拒否する機能を実装予定です。

- プラン変更APIエンドポイントの作成
- 変更前の制限チェック（生徒数・プリセット数）
- 制限超過時の処理：
  - オプション1: プラン変更を拒否し、エラーメッセージを表示
  - オプション2: 制限超過分のデータを自動削除（削除対象の選定ロジックが必要）
  - オプション3: 警告を表示し、ユーザーに削除を促す確認画面を表示
- フロントエンドにプラン変更UIを追加

実装場所：
- API: `app/api/teacher/plan/route.js`（新規作成）
- UI: `app/teacher/settings/page.jsx`（新規作成）
- バリデーション: `lib/plans.js`に関数追加

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
