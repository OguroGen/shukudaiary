import LoginForm from '@/components/student/LoginForm'

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-50 p-2">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 border-2 border-yellow-300">
        <LoginForm />
      </div>
    </div>
  )
}

