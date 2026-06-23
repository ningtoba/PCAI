import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

interface ImageLinkInputProps {
  onUpload: (imageFile: ImageFile) => void
}
const ImageLinkInput: FC<ImageLinkInputProps> = ({
  onUpload,
}) => {
  const { t } = useTranslation()
  const [imageLink, setImageLink] = useState('')

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) { return '' }
    if (/^https?:\/\//i.test(trimmed)) { return trimmed }
    if (/^ftp:\/\//i.test(trimmed)) { return trimmed }
    return `https://${trimmed}`
  }

  const handleClick = () => {
    const url = normalizeUrl(imageLink)
    const imageFile = {
      type: TransferMethod.remote_url,
      _id: `${Date.now()}`,
      fileId: '',
      progress: url ? 100 : -1,
      url,
    }

    onUpload(imageFile)
  }

  return (
    <div className='flex items-center pl-1.5 pr-1 h-8 border border-dify-border bg-dify-input rounded-lg'>
      <input
        className='grow mr-0.5 px-1 h-[18px] text-[13px] outline-none appearance-none bg-transparent text-dify-text-primary placeholder:text-dify-text-placeholder'
        value={imageLink}
        onChange={e => setImageLink(e.target.value)}
        placeholder={t('common.imageUploader.pasteImageLinkInputPlaceholder') || ''}
      />
      <Button
        type='primary'
        className='!h-6 text-xs font-medium'
        disabled={!imageLink}
        onClick={handleClick}
      >
        {t('common.operation.ok')}
      </Button>
    </div>
  )
}

export default ImageLinkInput
