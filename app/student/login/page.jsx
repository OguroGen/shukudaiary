import LoginForm from '@/components/student/LoginForm'

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border-4 border-yellow-300">
        <LoginForm />
      </div>
    </div>
  )
}

