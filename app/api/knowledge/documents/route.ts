import { type NextRequest, NextResponse } from 'next/server'
import { fetchDocuments, uploadDocument } from '@/service/knowledge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const keyword = searchParams.get('keyword') || undefined

    const result = await fetchDocuments(page, limit, keyword)
    return NextResponse.json(result)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const indexingTechnique = (formData.get('indexing_technique') as string) || 'high_quality'
    const docForm = (formData.get('doc_form') as string) || 'text_model'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const result = await uploadDocument(file, indexingTechnique, docForm)
    return NextResponse.json(result)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
