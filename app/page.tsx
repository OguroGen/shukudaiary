import { redirect } from 'next/navigation'

export default function Home() {
  // Always redirect to student login page
  redirect('/student/login')
}
