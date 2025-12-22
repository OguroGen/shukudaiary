import { Suspense } from 'react'
import TeacherLoginForm from '@/components/teacher/LoginForm'
import LoadingState from '@/components/teacher/LoadingState'

export default function TeacherLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoadingState />}>
          <TeacherLoginForm />
        </Suspense>
      </div>
    </div>
  )
}

