'use client'
import type { FC } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DocumentIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { API_PREFIX } from '@/config'
import type { KnowledgeDocument } from '@/service/knowledge'

interface DocumentPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const STATUS_LABELS: Record<string, string> = {
  indexing: 'Indexing...',
  completed: 'Ready',
  available: 'Ready',
  error: 'Error',
  queuing: 'Queued',
  paused: 'Paused',
}

const STATUS_COLORS: Record<string, string> = {
  indexing: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
  completed: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  available: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
  queuing: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  paused: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) { return `${bytes}B` }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)}KB` }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const DocumentPanel: FC<DocumentPanelProps> = ({ isCollapsed, onToggleCollapse }) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_PREFIX}/knowledge/documents?limit=50`)
      if (!res.ok) { throw new Error('Failed to fetch') }
      const data = await res.json()
      setDocuments(data.data || [])
    }
    catch {
      // silently fail — user can retry
    }
    finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isCollapsed) { fetchDocs() }
  }, [isCollapsed, fetchDocs])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { return }

    setUploadError(null)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('indexing_technique', 'high_quality')
      formData.append('doc_form', 'text_model')

      const res = await fetch(`${API_PREFIX}/knowledge/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }

      await fetchDocs()
    }
    catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
    finally {
      setIsUploading(false)
      if (fileInputRef.current) { fileInputRef.current.value = '' }
    }
  }

  const handleDelete = async (docId: string) => {
    setDeletingId(docId)
    try {
      const res = await fetch(`${API_PREFIX}/knowledge/documents/${docId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }))
        throw new Error(err.error || 'Delete failed')
      }
      setDocuments(prev => prev.filter(d => d.id !== docId))
    }
    catch {
      // silently fail
    }
    finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col border-t border-gray-200 dark:border-gray-800">
      {/* Header */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DocumentIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span>Documents</span>
        </div>
        {isCollapsed
          ? <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          : <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      </button>

      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-2">
          {/* Upload button */}
          <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-primary-600 dark:text-primary-400 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <ArrowUpTrayIcon className="h-4 w-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,.md,.csv,.xlsx,.html,.htm,.json"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>

          {uploadError && (
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <XMarkIcon className="h-3 w-3" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Document list */}
          {isLoading && (
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Loading documents...</div>
          )}

          {!isLoading && documents.length === 0 && (
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
              No documents yet. Upload one to get started.
            </div>
          )}

          {!isLoading && documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 group"
            >
              <DocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-700 dark:text-gray-300 truncate" title={doc.name}>
                  {doc.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[doc.display_status] || 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'}`}>
                    {STATUS_LABELS[doc.display_status] || doc.display_status}
                  </span>
                  {doc.data_source_detail_dict?.upload_file?.size && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatFileSize(doc.data_source_detail_dict.upload_file.size)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50"
                title="Delete document"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(DocumentPanel)
