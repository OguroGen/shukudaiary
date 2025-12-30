-- Add preset_id and fixed_question_id to homeworks table
-- 宿題に使用したプリセットIDと固定問題IDを保存

ALTER TABLE homeworks ADD COLUMN preset_id UUID REFERENCES presets(id) ON DELETE SET NULL;
ALTER TABLE homeworks ADD COLUMN fixed_question_id UUID REFERENCES fixed_questions(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_homeworks_preset_id ON homeworks(preset_id);
CREATE INDEX idx_homeworks_fixed_question_id ON homeworks(fixed_question_id);

