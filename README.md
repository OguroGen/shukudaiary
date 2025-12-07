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

SupabaseダッシュボードのSQL Editorで、以下のマイグレーションファイルを順番に実行してください:

1. `supabase/migrations/001_initial_schema.sql` - 基本テーブルとRLSポリシー
2. `supabase/migrations/002_enable_realtime.sql` - Realtime機能の有効化
3. `supabase/migrations/003_add_plan_type.sql` - プラン管理用カラムの追加
4. `supabase/migrations/004_add_questions_to_homeworks.sql` - 宿題の問題データ保存用カラムの追加
5. `supabase/migrations/005_add_branches.sql` - 教場（branches）機能の追加
6. `supabase/migrations/006_add_teacher_role.sql` - 先生のroleカラム追加（オーナー機能）
7. `supabase/migrations/007_add_signup_policies.sql` - サインアップ時のRLSポリシー追加（**重要：サインアップ機能を使用する場合は必須**）
8. `supabase/migrations/008_add_test_plan.sql` - テストプランの追加
9. `supabase/migrations/009_fix_student_login_id_unique.sql` - 生徒のlogin_idのユニーク制約をSchool単位に修正（**重要：005_add_branches.sql実行後は必須**）
10. `supabase/migrations/010_add_school_slug.sql` - 教室スラッグ（slug）機能の追加
11. `supabase/migrations/011_make_school_slug_not_null.sql` - 教室スラッグ（slug）をNOT NULLに変更（**重要：すべての教室にスラッグを設定してから実行**）

これにより以下のテーブルが作成されます:
- `schools`: 教室情報
- `teachers`: 先生情報
- `branches`: 教場情報（1つの教室に複数の教場を持つことが可能）
- `teacher_branches`: 先生と教場の紐付け（多対多の関係）
- `students`: 生徒情報（教場に紐付け）
- `presets`: 難度プリセット
- `homeworks`: 宿題情報（問題データを含む）
- `answers`: 回答データ

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 6. Supabase Auth設定（本番環境向け）

#### メール確認機能の有効化

本番環境では、メールアドレスの確認機能を有効化することを強く推奨します。これにより、存在しないメールアドレスでの登録を防げます。

**設定手順:**

1. Supabaseダッシュボードにログイン
2. 左側のメニューから **「Authentication」** を選択
3. **「Settings」** タブを開く
4. **「Confirm email」** のスイッチを **ON** に設定

**注意事項:**
- 開発環境では、メール確認をOFFにしている場合、存在しないメールアドレスでも登録できてしまいます
- 本番環境にデプロイする前に、必ずメール確認を有効化してください
- メール確認を有効化すると、ユーザーは登録後に確認メールをクリックしないとログインできなくなります

#### カスタムSMTP設定（オプション）

Supabaseのデフォルトメール送信には制限があるため、本番環境では独自のSMTPサーバーを設定することを推奨します。

1. Supabaseダッシュボード → **Project Settings** → **SMTP Settings**
2. **「Enable Custom SMTP」** をONに設定
3. 以下の情報を入力:
   - **Sender email**: 送信元のメールアドレス
   - **Sender name**: 送信者名
   - **Host**: SMTPサーバーのホスト名
   - **Port number**: SMTPサーバーのポート番号（通常は465または587）
   - **Username**: SMTPサーバーのユーザー名
   - **Password**: SMTPサーバーのパスワード

#### メールテンプレートのカスタマイズ（オプション）

1. Authentication → **Email Templates**
2. 「Confirm signup」テンプレートを編集

### 7. カスタムドメイン設定（Vercel）

本アプリケーションは、以下の2つのドメインでアクセスできます：

- **生徒側**: `shukudaiary.anzan.online` → 生徒ログインページに自動リダイレクト
- **先生側**: `teacher.shukudaiary.anzan.online` → 先生ログインページに自動リダイレクト

#### Vercelダッシュボードでの設定

1. [Vercelダッシュボード](https://vercel.com)にログイン
2. プロジェクトを選択
3. **Settings** → **Domains** を開く
4. 以下のドメインを追加:
   - `shukudaiary.anzan.online`
   - `teacher.shukudaiary.anzan.online`
5. 各ドメインの追加後、Vercelが表示するDNS設定情報を確認

#### エックスサーバーでのDNS設定

エックスサーバーのサーバーパネルで、以下のCNAMEレコードを設定してください：

1. サーバーパネルにログイン
2. **ドメイン設定** → **DNSレコード設定** を開く
3. 以下のCNAMEレコードを追加:

   **shukudaiary.anzan.online の場合:**
   - **ホスト名**: `shukudaiary`（または空欄、ドメインによって異なる場合があります）
   - **タイプ**: `CNAME`
   - **値**: Vercelが表示するCNAME値（通常は `cname.vercel-dns.com` など）

   **teacher.shukudaiary.anzan.online の場合:**
   - **ホスト名**: `teacher`
   - **タイプ**: `CNAME`
   - **値**: Vercelが表示するCNAME値（通常は `cname.vercel-dns.com` など）

**注意事項:**
- DNS設定の反映には数分から最大48時間かかる場合があります
- 設定後、Vercelダッシュボードでドメインの状態を確認してください（「Valid Configuration」と表示されれば設定完了）
- ドメイン設定が完了すると、各ドメインにアクセスした際に自動的に適切なログインページにリダイレクトされます

#### ドメイン別のリダイレクト動作

アプリケーションは、アクセスしたドメインに基づいて自動的に適切なページにリダイレクトします：

- `shukudaiary.anzan.online` にアクセス → `/student/login` にリダイレクト
- `teacher.shukudaiary.anzan.online` にアクセス → `/teacher/login` にリダイレクト
- 開発環境（`localhost`）では、デフォルトで `/student/login` にリダイレクト

この動作は `middleware.js` で実装されています。

## 初期設定

### サインアップ機能（推奨）

1. ブラウザで `/teacher/signup` にアクセス
2. 教室名、メールアドレス、パスワードを入力
3. Freeプランを選択してアカウントを作成
4. 自動的にログインされ、ホーム画面に遷移

**注意**: サインアップ時に作成される最初の先生アカウントは自動的に`role='owner'`（オーナー）として設定されます。

### 手動での教室と先生の作成（従来の方法）

手動で教室と先生を作成する場合:

1. Supabaseダッシュボードで以下を実行:

```sql
-- 教室を作成
INSERT INTO schools (name, plan_type) VALUES ('テスト教室', 'free');

-- 教場を作成
INSERT INTO branches (school_id, name)
VALUES (
  '作成した教室のID',
  '__DEFAULT__'  -- システムデフォルト名（後で変更可能）
);

-- 先生用のSupabase Authユーザーを作成（SupabaseダッシュボードのAuthenticationから）
-- その後、teachersテーブルにレコードを追加
INSERT INTO teachers (id, school_id, email, role)
VALUES (
  '作成したSupabase AuthユーザーのID',
  '作成した教室のID',
  'teacher@example.com',
  'owner'  -- または 'teacher'
);

-- 先生と教場を紐付け
INSERT INTO teacher_branches (teacher_id, branch_id)
VALUES (
  '作成したSupabase AuthユーザーのID',
  '作成した教場のID'
);
```

### 生徒の作成

先生でログイン後、生徒管理画面から生徒を追加できます。

## 機能

### 生徒側

- ログイン（login_id + password）
- ホーム画面（宿題一覧）
- 宿題機能（開始確認 → 問題画面 → 結果画面）
- パスワード変更

### 先生側

- サインアップ（新規登録）
  - 教室名、メールアドレス、パスワードでアカウント作成
  - Freeプランのみ選択可能（Basic以上は開発中表示）
  - サインアップ時に作成される最初の先生は自動的にオーナー（owner）として設定
- ログイン（Supabase Auth）
- ダッシュボード（統計情報、メニュー）
- 生徒管理（一覧、詳細、追加、パスワードリセット）
- 宿題管理（一覧、作成、詳細表示、問題のプレビュー・編集）
- プリセット管理（一覧、作成、編集、削除）

## プラン体系

現在はMVP段階のため、生徒数とプリセット数の制限のみ実装されています。プラン切り替え機能は実装済みです。

### 🆓 Free（MVP）
- 生徒数: 10人
- プリセット: 10件
- 結果保存: 90日
- メッセージ: なし
- ※まず試す用の導入プラン

### 🔰 Basic ¥2,000/月（将来実装予定）
- 生徒数: 30人
- プリセット: 30件
- 結果保存: 無期限
- メッセージ: なし
- 地方の小規模教室向けの低価格導入プラン

### 🏫 Standard ¥5,000〜6,000/月（将来実装予定）
- 生徒数: 100人
- プリセット: 100件
- 結果保存: 無期限
- メッセージ: 個別送信のみ
- 成長フェーズの教室向けのメインプラン

### 👑 Premium ¥9,800〜/月（将来実装予定）
- 生徒数: 無制限
- プリセット: 無制限
- 結果保存: 無期限
- メッセージ: 個別＋一斉送信（将来）
- 教場（複数教室）管理
- 法人・多教場展開向けハイエンド

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

**教室スラッグ機能（実装済み）**

各教室にスラッグ（URL識別子）を追加し、教室ごとの専用URLを実現しました。これにより、生徒用ページに教室名を表示できるようになりました。

実装内容：
- ログインURL形式: `/student/[school_slug]/login`
- すべての生徒ページに教室名を表示（Layoutで実装）
- ログイン時にスラッグを取得し、新しいURL形式にリダイレクト
- サインアップ時にスラッグを入力（英数字とハイフンのみ）

実装場所：
- `supabase/migrations/010_add_school_slug.sql` - schoolsテーブルにslugカラムを追加
- `supabase/migrations/011_make_school_slug_not_null.sql` - slugカラムにNOT NULL制約を追加
- `app/api/schools/[slug]/route.js` - スラッグから教室名を取得するAPI
- `app/student/[school_slug]/layout.jsx` - 教室名を表示するLayout
- `app/student/[school_slug]/` - 新しいルーティング構造（login, home, homework, password）
- `app/api/teacher/signup/route.js` - サインアップ時にスラッグを保存
- `app/api/student/login/route.js` - ログイン時にスラッグを返す
- `components/student/LoginForm.jsx` - ログイン後のリダイレクト処理
- `app/teacher/home/page.jsx` - 生徒用ログインURLの表示
- `app/teacher/settings/page.jsx` - スラッグ変更機能

既存教室への対応：
- すべての教室にスラッグが設定されています
- スラッグはNOT NULL制約により必須となっています

**教場専用ログインURL機能（将来実装予定）**

各教場から発行する生徒用のログインURLを教場専用にし、そのURLからアクセスした場合はその教場の生徒のみがログインできるようにします。

実装内容：
- ログインURL形式: `/student/[school_slug]/login?branch=<branch_id>` または `/student/[school_slug]/login?branch=<branch_token>`
- ログイン処理で`branch_id`と`login_id`の組み合わせで検索
- 先生側のホームページや生徒管理画面に教場専用URLを表示・コピー機能を追加

実装場所：
- `components/student/LoginForm.jsx` - URLパラメータから`branch_id`を取得
- `lib/auth/student.js` - `authenticateStudent`関数で`branch_id`を考慮した認証
- `app/api/student/login/route.js` - `branch_id`をリクエストに含める
- `app/teacher/home/page.jsx` - 教場専用URLを表示・コピー機能を追加

背景：
- 現在、異なる教場に同じ`login_id`と`password`を持つ生徒がいる場合、どちらの教場からでもログインできてしまう問題がある
- データベース制約では`UNIQUE(school_id, login_id)`によりSchool単位でのユニーク性は担保されているが、ログイン処理で教場を考慮していない
- 教場専用URLにより、URLに含まれる`branch_id`で正しい教場の生徒のみがログインできるようになる
- 注意: 生徒ID（`login_id`）のユニーク制約はSchool単位。同じSchool内の異なる教場でも同じ`login_id`は使用できない

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
