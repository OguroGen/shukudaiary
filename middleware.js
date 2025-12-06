import { NextResponse } from 'next/server'

export function middleware(request) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // 既に/teacher/*や/student/*のパスにアクセスしている場合は、リダイレクトしない
  if (pathname.startsWith('/teacher/') || pathname.startsWith('/student/') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ルートパス（/）のみをリダイレクト対象とする
  if (pathname === '/') {
    // teacher.shukudaiary.anzan.onlineでアクセスした場合
    if (host === 'teacher.shukudaiary.anzan.online') {
      return NextResponse.redirect(new URL('/teacher/login', request.url))
    }

    // shukudaiary.anzan.onlineでアクセスした場合
    if (host === 'shukudaiary.anzan.online') {
      return NextResponse.redirect(new URL('/student/login', request.url))
    }

    // 開発環境（localhost）では、既存の動作を維持（/student/loginにリダイレクト）
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
      return NextResponse.redirect(new URL('/student/login', request.url))
    }
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

