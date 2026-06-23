import { type NextRequest, NextResponse } from 'next/server'
import { deleteDocument } from '@/service/knowledge'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await deleteDocument(id)
    return new NextResponse(null, { status: 204 })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
