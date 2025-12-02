import { Button } from '@/components/ui/button'
import FileUploadDialog from '@/components/shadcn-studio/blocks/dashboard-dialog-11/dialog-file-upload'

const DialogPage = () => {
  return (
    <div className='flex h-dvh items-start justify-center p-8'>
      <FileUploadDialog
        defaultOpen
        trigger={
          <Button variant='outline'>
            <span>Upload File</span>
          </Button>
        }
      />
    </div>
  )
}

export default DialogPage
