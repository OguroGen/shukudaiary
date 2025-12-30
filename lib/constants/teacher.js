/**
 * 先生側で使用する定数
 */

export const TEACHER_ROUTES = {
  HOME: '/teacher/home',
  LOGIN: '/teacher/login',
  SIGNUP: '/teacher/signup',
  STUDENTS: '/teacher/students',
  HOMEWORKS: '/teacher/homeworks',
  PRESETS: '/teacher/presets',
  SETTINGS: '/teacher/settings'
}

export const HOMEWORK_TYPES = {
  MULTIPLICATION: 'mul',
  DIVISION: 'div',
  MITORI: 'mitori'
}

export const HOMEWORK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const SORT_OPTIONS = {
  CREATED_AT: 'created_at',
  DUE_DATE_START: 'due_date_start',
  DUE_DATE_END: 'due_date_end',
  STUDENT: 'student',
  TYPE: 'type'
}

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
}

