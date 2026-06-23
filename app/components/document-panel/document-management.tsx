'use client'
import type { FC } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DocumentIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { API_PREFIX, API_URL } from '@/config'
import type { KnowledgeDocument } from '@/service/knowledge'

const SL: Record<string, string> = { indexing: 'Indexing...', completed: 'Ready', available: 'Ready', error: 'Error', queuing: 'Queued', paused: 'Paused' }
function sc(s: string): string {
  switch (s) { case 'indexing': return 'text-yellow-400 bg-yellow-900/30'; case 'completed': case 'available': return 'text-green-400 bg-green-900/30'; case 'error': return 'text-red-400 bg-red-900/30'; case 'queuing': return 'text-blue-400 bg-blue-900/30'; default: return 'text-dify-text-tertiary bg-dify-hover' }
}
function ffs(b: number): string { if (b < 1024) { return `${b}B` } if (b < 1024 * 1024) { return `${(b / 1024).toFixed(1)}KB` } return `${(b / (1024 * 1024)).toFixed(1)}MB` }
function fd(ts: number): string { return new Date(ts * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }

const DocumentManagement: FC = () => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]); const [loading, setLoading] = useState(false); const [uploading, setUploading] = useState(false); const [err, setErr] = useState<string | null>(null); const [delId, setDelId] = useState<string | null>(null); const fi = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => { setLoading(true); try { const r = await fetch(`${API_PREFIX}/knowledge/documents?limit=50`); if (!r.ok) { throw new Error('Failed') } const d = await r.json(); setDocs(d.data || []) } catch { /* */ } finally { setLoading(false) } }, [])
  useEffect(() => { fetchDocs() }, [fetchDocs])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) { return } setErr(null); setUploading(true); try { const fd = new FormData(); fd.append('file', f); fd.append('indexing_technique', 'high_quality'); fd.append('doc_form', 'text_model'); const r = await fetch(`${API_PREFIX}/knowledge/documents`, { method: 'POST', body: fd }); if (!r.ok) { const j = await r.json().catch(() => ({ error: 'Upload failed' })); throw new Error(j.error || 'Upload failed') }; await fetchDocs() } catch (ex: unknown) { setErr(ex instanceof Error ? ex.message : 'Upload failed') } finally { setUploading(false); if (fi.current) { fi.current.value = '' } } }
  const download = async (id: string) => { try { const r = await fetch(`${API_PREFIX}/knowledge/documents/${id}/download`); if (!r.ok) { throw new Error('Failed') } const d = await r.json(); if (d.url) { const baseUrl = API_URL.replace(/\/v1\/?$/, ''); const fullUrl = d.url.startsWith('http') ? d.url : `${baseUrl}${d.url}`; window.open(fullUrl, '_blank', 'noopener,noreferrer') } } catch { /* */ } }
  // eslint-disable-next-line no-alert
  const del = async (id: string) => { if (!window.confirm('Delete this document?')) { return } setDelId(id); try { const r = await fetch(`${API_PREFIX}/knowledge/documents/${id}`, { method: 'DELETE' }); if (!r.ok && r.status !== 204) { throw new Error('Failed') } setDocs(p => p.filter(d => d.id !== id)) } catch { /* */ } finally { setDelId(null) } }

  return (
    <div>
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div><h1 className="text-lg sm:text-xl font-semibold text-dify-text-primary">Documents</h1><p className="text-xs sm:text-sm text-dify-text-tertiary mt-0.5 sm:mt-1">Upload documents to your knowledge base for retrieval during chat</p></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={fetchDocs} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm text-dify-text-tertiary hover:bg-dify-hover rounded-lg transition-colors"><ArrowPathIcon className="h-4 w-4" /><span className="hidden sm:inline">Refresh</span></button>
          <label className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer transition-colors"><ArrowUpTrayIcon className="h-4 w-4" /><span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload Document'}</span><span className="sm:hidden">{uploading ? '...' : 'Upload'}</span><input ref={fi} type="file" className="hidden" accept=".txt,.pdf,.doc,.docx,.md,.csv,.xlsx,.html,.htm,.json" onChange={upload} disabled={uploading} /></label>
        </div>
      </div>
      {err && <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-lg mb-4"><XMarkIcon className="h-4 w-4 flex-shrink-0" /><span>{err}</span></div>}
      {loading && <div className="text-sm text-dify-text-tertiary text-center py-16"><ArrowPathIcon className="h-6 w-6 mx-auto mb-3 animate-spin" />Loading documents...</div>}
      {!loading && !docs.length && <div className="text-center py-16 border-2 border-dashed border-dify-border rounded-xl"><DocumentIcon className="h-12 w-12 mx-auto mb-3 text-dify-text-placeholder" /><p className="text-sm text-dify-text-tertiary mb-2">No documents yet</p><p className="text-xs text-dify-text-placeholder">Upload PDFs, TXT, DOCX, MD, CSV, and more</p></div>}
      {!loading && docs.length > 0 && (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden sm:block border border-dify-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_110px_100px] gap-4 px-4 py-3 bg-dify-hover text-xs font-medium text-dify-text-tertiary uppercase tracking-wider"><span>Name</span><span>Status</span><span>Uploaded</span><span></span></div>
            <div className="divide-y divide-dify-border-section">
              {docs.map(d => (
                <div key={d.id} className="grid grid-cols-[1fr_100px_110px_100px] gap-4 px-4 py-3 items-center hover:bg-dify-hover/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0"><DocumentIcon className="h-5 w-5 text-dify-text-tertiary flex-shrink-0" /><div className="min-w-0"><div className="text-sm text-dify-text-primary truncate font-medium" title={d.name}>{d.name}</div><div className="text-xs text-dify-text-placeholder mt-0.5">{d.data_source_detail_dict?.upload_file?.size ? ffs(d.data_source_detail_dict.upload_file.size) : ''}{d.word_count > 0 && <span> &middot; {d.word_count.toLocaleString()} words</span>}</div></div></div>
                  <div><span className={`inline-flex text-xs px-2 py-0.5 rounded-full ${sc(d.display_status)}`}>{SL[d.display_status] || d.display_status}</span></div>
                  <div className="text-xs text-dify-text-tertiary">{fd(d.created_at)}</div>
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => download(d.id)} className="p-2 rounded-md text-dify-text-tertiary hover:text-dify-accent hover:bg-dify-hover transition-colors" title="Download"><ArrowDownTrayIcon className="h-4 w-4" /></button>
                    <button type="button" onClick={() => del(d.id)} disabled={delId === d.id} className="p-2 rounded-md text-dify-text-tertiary hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile cards — hidden on desktop */}
          <div className="sm:hidden space-y-2">
            {docs.map(d => (
              <div key={d.id} className="border border-dify-border rounded-xl p-3 bg-dify-default/50">
                <div className="flex items-start gap-2.5 min-w-0">
                  <DocumentIcon className="h-5 w-5 text-dify-text-tertiary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-dify-text-primary font-medium truncate" title={d.name}>{d.name}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ${sc(d.display_status)}`}>{SL[d.display_status] || d.display_status}</span>
                      <span className="text-xs text-dify-text-tertiary">{fd(d.created_at)}</span>
                    </div>
                    <div className="text-xs text-dify-text-placeholder mt-1">{d.data_source_detail_dict?.upload_file?.size ? ffs(d.data_source_detail_dict.upload_file.size) : ''}{d.word_count > 0 && <span> &middot; {d.word_count.toLocaleString()} words</span>}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-dify-border-section">
                  <button type="button" onClick={() => download(d.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md text-dify-accent hover:bg-dify-hover transition-colors"><ArrowDownTrayIcon className="h-4 w-4" />Download</button>
                  <button type="button" onClick={() => del(d.id)} disabled={delId === d.id} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"><TrashIcon className="h-4 w-4" />Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
export default React.memo(DocumentManagement)
