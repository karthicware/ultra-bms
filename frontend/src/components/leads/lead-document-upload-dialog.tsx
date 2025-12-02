'use client'

import { useState, type ReactNode } from 'react'

import { AlertCircleIcon, CheckCircle2Icon, FileTextIcon, UploadIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { formatBytes, useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload'
import { uploadDocument } from '@/services/leads.service'
import { LeadDocumentType } from '@/types'

import { cn } from '@/lib/utils'

type Props = {
  leadId: string
  trigger: ReactNode
  onUploadComplete?: () => void
  defaultOpen?: boolean
  className?: string
}

type UploadProgress = {
  fileId: string
  progress: number
  completed: boolean
  error?: string
}

const DOCUMENT_TYPES: { value: LeadDocumentType; label: string }[] = [
  { value: LeadDocumentType.EMIRATES_ID, label: 'Emirates ID' },
  { value: LeadDocumentType.PASSPORT, label: 'Passport' },
  { value: LeadDocumentType.MARRIAGE_CERTIFICATE, label: 'Marriage Certificate' },
  { value: LeadDocumentType.VISA, label: 'Visa' },
  { value: LeadDocumentType.OTHER, label: 'Other' }
]

// Returns a file icon component for non-image files, or false for image files
const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileName = file.file instanceof File ? file.file.name : file.file.name
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const extension = fileName.split('.').pop()?.toLowerCase()

  const isImage = fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'svg'].includes(extension || '')

  return isImage ? false : <FileTextIcon className='size-5' />
}

const LeadDocumentUploadDialog = ({ leadId, defaultOpen = false, trigger, onUploadComplete, className }: Props) => {
  const [open, setOpen] = useState(defaultOpen)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [selectedDocType, setSelectedDocType] = useState<LeadDocumentType>(LeadDocumentType.EMIRATES_ID)
  const [isUploading, setIsUploading] = useState(false)

  const maxSizeMB = 5
  const maxSize = maxSizeMB * 1024 * 1024
  const maxFiles = 6

  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, clearFiles, getInputProps }
  ] = useFileUpload({
    maxSize,
    multiple: true,
    maxFiles,
    accept: '.pdf,.jpg,.jpeg,.png'
  })

  const handleFileRemoved = (fileId: string) => {
    setUploadProgress(prev => prev.filter(item => item.fileId !== fileId))
    removeFile(fileId)
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    // Initialize progress for all files
    setUploadProgress(
      files.map(file => ({
        fileId: file.id,
        progress: 0,
        completed: false
      }))
    )

    // Upload files sequentially
    for (const file of files) {
      if (!(file.file instanceof File)) continue

      try {
        // Simulate progress updates
        setUploadProgress(prev =>
          prev.map(item => (item.fileId === file.id ? { ...item, progress: 30 } : item))
        )

        await uploadDocument(leadId, file.file, selectedDocType)

        setUploadProgress(prev =>
          prev.map(item => (item.fileId === file.id ? { ...item, progress: 100, completed: true } : item))
        )
      } catch (error: unknown) {
        const errorMessage = error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed'
        console.error('[UPLOAD] Error uploading file:', { fileName: file.file.name, error })
        setUploadProgress(prev =>
          prev.map(item =>
            item.fileId === file.id ? { ...item, error: errorMessage, progress: 0 } : item
          )
        )
      }
    }

    setIsUploading(false)

    // Check if all uploads completed successfully
    const allCompleted = files.every(file => {
      const progress = uploadProgress.find(p => p.fileId === file.id)
      return progress?.completed || false
    })

    // Small delay to show completion state before closing
    setTimeout(() => {
      if (allCompleted || files.length > 0) {
        onUploadComplete?.()
        clearFiles()
        setUploadProgress([])
        setOpen(false)
      }
    }, 500)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      clearFiles()
      setUploadProgress([])
      setSelectedDocType(LeadDocumentType.EMIRATES_ID)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className={cn(
          'flex max-h-[min(650px,80vh)] flex-col gap-0 p-0 sm:max-w-md [&>[data-slot=dialog-close]>svg]:size-5',
          className
        )}
      >
        <ScrollArea className='flex max-h-full flex-col overflow-hidden'>
          <div className='flex flex-col gap-4 p-6'>
            <DialogHeader>
              <DialogTitle className='leading-7'>Upload Document</DialogTitle>
            </DialogHeader>

            <div className='flex flex-col gap-4'>
              {/* Document Type Selection */}
              <div className='space-y-1.5'>
                <Label htmlFor='document-type'>Document Type</Label>
                <Select value={selectedDocType} onValueChange={v => setSelectedDocType(v as LeadDocumentType)}>
                  <SelectTrigger id='document-type' data-testid='select-document-type'>
                    <SelectValue placeholder='Select document type' />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drop Zone */}
              <div
                role='button'
                onClick={openFileDialog}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-dragging={isDragging || undefined}
                data-files={files.length > 0 || undefined}
                className='border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-40 flex-col items-center justify-center gap-3 overflow-hidden rounded-md border border-dashed p-6 text-center transition-colors hover:bg-muted/50 has-[input:focus]:ring-[3px]'
              >
                <input {...getInputProps()} className='sr-only' aria-label='Upload document file' />
                <UploadIcon className='size-8 stroke-1 text-muted-foreground' />
                <div>
                  <p className='font-medium text-sm'>Drag & Drop or Click to upload</p>
                  <p className='text-muted-foreground text-xs mt-1'>
                    PDF, JPG, PNG ∙ Max {maxSizeMB}MB ∙ Up to {maxFiles} files
                  </p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className='flex w-full flex-col gap-2'>
                  <div className='w-full space-y-2'>
                    {files.map((file, index) => {
                      const fileProgress = uploadProgress.find(p => p.fileId === file.id)
                      const isFileUploading = fileProgress && !fileProgress.completed && !fileProgress.error
                      const hasError = fileProgress?.error

                      return (
                        <div
                          key={file.id}
                          data-uploading={isFileUploading || undefined}
                          data-error={hasError || undefined}
                          className='bg-muted flex flex-col gap-1 rounded-lg p-3 transition-opacity duration-300 data-[error=true]:bg-destructive/10'
                        >
                          <div className='flex justify-between gap-2'>
                            <div className='flex items-center gap-3 overflow-hidden in-data-[uploading=true]:opacity-50'>
                              <div className='bg-accent aspect-square shrink-0 rounded p-2'>
                                {getFileIcon(file) || (
                                  <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className='size-6 rounded-[inherit] object-cover'
                                  />
                                )}
                              </div>
                              <div className='flex min-w-0 flex-col gap-0.5'>
                                <p className='truncate text-sm font-medium'>
                                  Document {index + 1}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  {formatBytes(file.file instanceof File ? file.file.size : file.file.size)}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-1'>
                              {fileProgress?.completed && (
                                <CheckCircle2Icon className='size-4 text-green-600' />
                              )}
                              {hasError && (
                                <span className='text-destructive text-xs'>{hasError}</span>
                              )}
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-6 hover:bg-transparent'
                                onClick={e => {
                                  e.stopPropagation()
                                  handleFileRemoved(file.id)
                                }}
                                disabled={isUploading}
                                aria-label='Remove file'
                              >
                                <XIcon className='size-4' aria-hidden='true' />
                              </Button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {fileProgress && !fileProgress.completed && !fileProgress.error && (
                            <div className='mt-1 flex flex-col gap-1'>
                              <div className='bg-primary/10 h-1.5 w-full overflow-hidden rounded-full'>
                                <div
                                  className='bg-primary h-full transition-all duration-300 ease-out'
                                  style={{ width: `${fileProgress.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className='text-destructive flex items-center gap-1.5 text-xs' role='alert'>
                  <AlertCircleIcon className='size-3.5 shrink-0' />
                  <span>{errors[0]}</span>
                </div>
              )}
            </div>

            <DialogFooter className='flex-row justify-end gap-3 pt-2'>
              <DialogClose asChild>
                <Button variant='outline' disabled={isUploading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                data-testid='btn-upload'
              >
                {isUploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default LeadDocumentUploadDialog
