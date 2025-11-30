-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table (linked to Supabase Auth)
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, login_id)
);

-- Presets table
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mul', 'div', 'mitori')),
  name TEXT NOT NULL,
  left_digits INTEGER,
  right_digits INTEGER,
  rows INTEGER,
  question_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homeworks table
CREATE TABLE homeworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mul', 'div', 'mitori')),
  left_digits INTEGER,
  right_digits INTEGER,
  rows INTEGER,
  question_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  student_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  question_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_login_id ON students(login_id);
CREATE INDEX idx_presets_school_id ON presets(school_id);
CREATE INDEX idx_homeworks_student_id ON homeworks(student_id);
CREATE INDEX idx_homeworks_dates ON homeworks(start_date, end_date);
CREATE INDEX idx_answers_homework_id ON answers(homework_id);
CREATE INDEX idx_answers_student_id ON answers(student_id);
CREATE INDEX idx_answers_created_at ON answers(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Schools: Teachers can view their own school
CREATE POLICY "Teachers can view their own school"
  ON schools FOR SELECT
  USING (
    id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Teachers: Teachers can view their own record
CREATE POLICY "Teachers can view their own record"
  ON teachers FOR SELECT
  USING (id = auth.uid());

-- Students: Teachers can view students in their school
CREATE POLICY "Teachers can view students in their school"
  ON students FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Students: Teachers can insert students in their school
CREATE POLICY "Teachers can insert students in their school"
  ON students FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Students: Teachers can update students in their school
CREATE POLICY "Teachers can update students in their school"
  ON students FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Presets: Teachers can view presets in their school
CREATE POLICY "Teachers can view presets in their school"
  ON presets FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Presets: Teachers can manage presets in their school
CREATE POLICY "Teachers can manage presets in their school"
  ON presets FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Homeworks: Teachers can view homeworks for students in their school
CREATE POLICY "Teachers can view homeworks in their school"
  ON homeworks FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN teachers t ON s.school_id = t.school_id
      WHERE t.id = auth.uid()
    )
  );

-- Homeworks: Teachers can create homeworks for students in their school
CREATE POLICY "Teachers can create homeworks in their school"
  ON homeworks FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN teachers t ON s.school_id = t.school_id
      WHERE t.id = auth.uid()
    )
  );

-- Answers: Teachers can view answers for students in their school
CREATE POLICY "Teachers can view answers in their school"
  ON answers FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN teachers t ON s.school_id = t.school_id
      WHERE t.id = auth.uid()
    )
  );

-- Note: Student access policies will be handled via API routes with custom authentication
-- since students use login_id/password instead of Supabase Auth

