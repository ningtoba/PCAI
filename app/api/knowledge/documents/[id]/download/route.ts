import { type NextRequest, NextResponse } from 'next/server'
import { downloadDocument } from '@/service/knowledge'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const url = await downloadDocument(id)
    return NextResponse.json({ url })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get download URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
