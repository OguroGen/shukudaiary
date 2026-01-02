import { NextResponse } from 'next/server'

export function proxy(request) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // 開発環境では整合性チェックをスキップ（両方のパスにアクセス可能）
  const isDevelopment = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  
  // 本番環境でのみサブドメインとパスの整合性チェック
  if (!isDevelopment) {
    const isTeacherSubdomain = host === 'teacher.shukudaiary.anzan.online'
    const isStudentSubdomain = host === 'shukudaiary.anzan.online'

    // teacherサブドメインでstudentパスにアクセスしようとした場合
    if (isTeacherSubdomain && pathname.startsWith('/student/')) {
      return NextResponse.redirect(new URL('/teacher/login', request.url))
    }

    // studentサブドメインでteacherパスにアクセスしようとした場合
    // スラッグが分からないため、リダイレクトしない（404になる）
    if (isStudentSubdomain && pathname.startsWith('/teacher/')) {
      return NextResponse.next()
    }
  }

  // APIルートは通す（認証は各APIで行う）
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

