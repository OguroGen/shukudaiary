import LoginForm from '@/components/student/LoginForm'

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <LoginForm />
      </div>
    </div>
  )
}

