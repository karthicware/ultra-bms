'use client'

import { Download, FileText, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

type Document = {
  id: string
  documentType: string
  fileName: string
  fileSize: number
}

type Props = {
  documents: Document[]
  onDownload: (docId: string, fileName: string) => void
  onDelete: (docId: string) => void
  className?: string
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  if (bytes < k) return bytes + ' B'
  if (bytes < k * k) return (bytes / k).toFixed(0) + ' KB'
  return (bytes / (k * k)).toFixed(1) + ' MB'
}

const formatDocumentType = (type: string): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const DocumentList = ({ documents, onDownload, onDelete, className }: Props) => {
  if (!documents || documents.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <FileText className='h-6 w-6 text-muted-foreground mb-2' />
        <p className='text-muted-foreground text-sm'>No documents uploaded</p>
      </div>
    )
  }

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    const type = doc.documentType
    if (!acc[type]) acc[type] = []
    acc[type].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  return (
    <div className={cn('space-y-3 max-w-sm', className)}>
      {Object.entries(groupedDocs).map(([type, docs]) => (
        <div key={type} className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
            {formatDocumentType(type)}
          </p>
          <div className='space-y-1'>
            {docs.map((doc, index) => (
              <div
                key={doc.id}
                className='group flex items-center gap-2 px-2 py-1.5 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors'
              >
                <FileText className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                <span className='text-sm flex-1 truncate'>Document {index + 1}</span>
                <span className='text-xs text-muted-foreground'>{formatBytes(doc.fileSize)}</span>
                <div className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={() => onDownload(doc.id, doc.fileName)}
                  >
                    <Download className='h-3 w-3' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10'
                    onClick={() => onDelete(doc.id)}
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DocumentList
