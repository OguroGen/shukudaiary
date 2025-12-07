import { Suspense } from 'react'
import TeacherLoginForm from '@/components/teacher/LoginForm'

export default function TeacherLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">読み込み中...</p>
            </div>
          </div>
        }>
          <TeacherLoginForm />
        </Suspense>
      </div>
    </div>
  )
}

