import { KNOWLEDGE_API_KEY, KNOWLEDGE_API_URL, KNOWLEDGE_BASE_ID } from '@/config'

const KNOWLEDGE_API_PREFIX = `${KNOWLEDGE_API_URL}`

export interface KnowledgeDocument {
  id: string
  position: number
  data_source_type: string
  name: string
  created_from: string
  created_by: string
  created_at: number
  tokens: number
  indexing_status: string
  display_status: string
  enabled: boolean
  archived: boolean
  doc_form: string
  word_count: number
  hit_count: number
  data_source_detail_dict?: {
    upload_file?: {
      id: string
      name: string
      size: number
      extension: string
      mime_type: string
    }
  }
}

export interface DocumentListResponse {
  data: KnowledgeDocument[]
  has_more: boolean
  limit: number
  total: number
  page: number
}

export async function fetchDocuments(
  page = 1,
  limit = 20,
  keyword?: string,
): Promise<DocumentListResponse> {
  const datasetId = KNOWLEDGE_BASE_ID
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (keyword) { params.set('keyword', keyword) }

  const response = await fetch(
    `${KNOWLEDGE_API_PREFIX}/datasets/${datasetId}/documents?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KNOWLEDGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json() as Promise<DocumentListResponse>
}

export async function uploadDocument(
  file: File,
  indexingTechnique = 'high_quality',
  docForm = 'text_model',
): Promise<{ document: KnowledgeDocument, batch: string }> {
  const datasetId = KNOWLEDGE_BASE_ID
  const formData = new FormData()
  formData.append('file', file)
  formData.append('data', JSON.stringify({
    indexing_technique: indexingTechnique,
    doc_form: docForm,
    process_rule: {
      mode: 'custom',
      rules: {
        pre_processing_rules: [
          { id: 'remove_extra_spaces', enabled: true },
          { id: 'remove_urls_emails', enabled: false },
        ],
        segmentation: {
          separator: '\n',
          max_tokens: 4000,
          chunk_overlap: 2000,
        },
      },
    },
  }))

  const response = await fetch(
    `${KNOWLEDGE_API_PREFIX}/datasets/${datasetId}/document/create-by-file`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json() as Promise<{ document: KnowledgeDocument, batch: string }>
}

export async function deleteDocument(documentId: string): Promise<void> {
  const datasetId = KNOWLEDGE_BASE_ID
  const response = await fetch(
    `${KNOWLEDGE_API_PREFIX}/datasets/${datasetId}/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
      },
    },
  )

  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
}

export async function getDocumentIndexingStatus(
  datasetId: string,
  batch: string,
): Promise<{ indexing_status: string }> {
  const response = await fetch(
    `${KNOWLEDGE_API_PREFIX}/datasets/${datasetId}/documents/${batch}/indexing-status`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KNOWLEDGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json() as Promise<{ indexing_status: string }>
}

export async function downloadDocument(documentId: string): Promise<string> {
  const datasetId = KNOWLEDGE_BASE_ID
  const response = await fetch(
    `${KNOWLEDGE_API_PREFIX}/datasets/${datasetId}/documents/${documentId}/download`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Download failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const data = await response.json() as { url: string }
  return data.url
}
