'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTeacherAuth } from '@/hooks/useTeacherAuth'
import { useTeacherBranch } from '@/hooks/useTeacherBranch'
import { useStudents } from '@/hooks/useStudents'
import PageHeader from '@/components/teacher/PageHeader'
import LoadingState from '@/components/teacher/LoadingState'
import EmptyState from '@/components/teacher/EmptyState'

export default function StudentsListPage() {
  const { teacherId, loading: authLoading } = useTeacherAuth()
  const { branchId, loading: branchLoading } = useTeacherBranch(teacherId)
  const { students, loading: studentsLoading, refetch } = useStudents(branchId, { includeHomeworkStatus: true })
  const [searchTerm, setSearchTerm] = useState('')

  const loading = authLoading || branchLoading || studentsLoading

  const filteredStudents = students.filter(
    (student) =>
      student.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.login_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="生徒一覧"
          backHref="/teacher/home"
        >
          <Link
            href="/teacher/students/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              生徒を追加
            </span>
          </Link>
        </PageHeader>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ニックネームまたはログインIDで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          {filteredStudents.length === 0 ? (
            <EmptyState
              message="生徒が見つかりません。"
              icon={
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">ニックネーム</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">ログインID</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">最終活動日</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr 
                      key={student.id} 
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {student.nickname.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{student.nickname}</span>
                          {student.hasActiveHomework && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              しゅくだいアリー
                            </span>
                          )}
                          {!student.hasActiveHomework && student.hasFinishedHomework && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              しゅくだいオワリー
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded">
                          {student.login_id}
                        </code>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {student.last_activity
                          ? new Date(student.last_activity).toLocaleDateString('ja-JP')
                          : <span className="text-slate-400">なし</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/teacher/students/${student.id}`}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            詳細
                          </Link>
                          <Link
                            href={`/teacher/homeworks/create?student_id=${student.id}&from=students`}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            宿題を作成
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

