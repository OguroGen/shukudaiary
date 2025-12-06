import { redirect } from 'next/navigation'

export default function Home() {
  // ミドルウェアでドメインに基づいてリダイレクトされるため、
  // このページに到達することは通常ありません。
  // フォールバックとして、デフォルトで生徒ログインページにリダイレクト
  redirect('/student/login')
}

