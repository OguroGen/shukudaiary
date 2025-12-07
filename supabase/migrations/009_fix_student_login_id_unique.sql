-- ============================================
-- 生徒のlogin_idのユニーク制約をSchool単位に修正
-- ============================================
-- 
-- 変更内容:
-- - 教場単位(branch_id, login_id)のユニーク制約を削除
-- - School単位(school_id, login_id)のユニーク制約を追加
-- 
-- 理由:
-- - 同じSchool内では、異なる教場間でも同じlogin_idを使用できないようにする
-- - これにより、School全体でlogin_idの一意性が保証される

-- 既存の教場単位のユニーク制約を削除
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_branch_id_login_id_key;

-- School単位のユニーク制約を追加
-- 既に存在する場合はスキップ（001_initial_schema.sqlで既に作成されている可能性がある）
DO $$
BEGIN
  -- 制約が存在しない場合のみ追加
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'students'::regclass
      AND conname = 'students_school_id_login_id_key'
  ) THEN
    ALTER TABLE students
    ADD CONSTRAINT students_school_id_login_id_key UNIQUE(school_id, login_id);
  END IF;
END $$;

-- 注意: 既存データで重複がある場合は、このマイグレーションは失敗します
-- その場合は、事前に重複データを確認・修正してから実行してください

