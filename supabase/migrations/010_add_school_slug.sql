-- ============================================
-- 教室スラッグ（slug）機能の追加
-- ============================================
-- 
-- 変更内容:
-- - schoolsテーブルにslugカラムを追加
-- - スラッグはURLで使用され、教室名を表示するために使用される
-- 
-- 注意:
-- - 既存教室（3教室）は手動でスラッグを設定する必要があります
-- - 例: UPDATE schools SET slug = 'tokyo-soroban' WHERE name = '東京そろばん教室';

-- 1. slugカラムを追加（NULLを許可 - 既存教室はNULLのまま）
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

-- 注意: 既存教室へのスラッグ設定は手動で行ってください
-- 例:
-- UPDATE schools SET slug = 'tokyo-soroban' WHERE name = '東京そろばん教室';
-- UPDATE schools SET slug = 'osaka-soroban' WHERE name = '大阪そろばん教室';
-- UPDATE schools SET slug = 'kyoto-soroban' WHERE name = '京都そろばん教室';

