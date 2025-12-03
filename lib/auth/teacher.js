import { createClient } from '@/lib/supabase/server'

export async function getTeacherByEmail(email) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('teachers')
    .select('id, school_id, email')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function getSchoolById(schoolId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('schools')
    .select('id, name')
    .eq('id', schoolId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

