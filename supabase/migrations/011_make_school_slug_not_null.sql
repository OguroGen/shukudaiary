-- ============================================
-- 教室スラッグ（slug）をNOT NULLに変更
-- ============================================
-- 
-- 変更内容:
-- - schoolsテーブルのslugカラムにNOT NULL制約を追加
-- - すべての教室にスラッグが設定されていることを保証
-- 
-- 注意:
-- - このマイグレーションを実行する前に、すべての教室にスラッグが設定されていることを確認してください
-- - NULLのスラッグがある場合は、このマイグレーションは失敗します

-- 1. 既存のNULLスラッグがないことを確認（エラーチェック）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schools WHERE slug IS NULL) THEN
    RAISE EXCEPTION 'スラッグが設定されていない教室があります。すべての教室にスラッグを設定してからこのマイグレーションを実行してください。';
  END IF;
END $$;

-- 2. NOT NULL制約を追加
ALTER TABLE schools
ALTER COLUMN slug SET NOT NULL;

-- 3. UNIQUE制約が既に存在することを確認（010_add_school_slug.sqlで追加済み）
-- 念のため、存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'schools'::regclass
      AND conname = 'schools_slug_key'
  ) THEN
    ALTER TABLE schools
    ADD CONSTRAINT schools_slug_key UNIQUE(slug);
  END IF;
END $$;

