import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY}`
export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`
export const APP_INFO: AppInfo = {
  title: 'RAG Chat',
  description: '',
  copyright: '',
  privacy_policy: '',
  default_language: 'en',
  disable_session_same_site: false,
}

export const KNOWLEDGE_API_KEY = `${process.env.NEXT_PUBLIC_KNOWLEDGE_API_KEY}`
export const KNOWLEDGE_BASE_ID = `${process.env.NEXT_PUBLIC_KNOWLEDGE_BASE_ID}`
export const KNOWLEDGE_API_URL = `${process.env.NEXT_PUBLIC_KNOWLEDGE_API_URL || process.env.NEXT_PUBLIC_API_URL}`

export const isShowPrompt = false
export const promptTemplate = ''

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
