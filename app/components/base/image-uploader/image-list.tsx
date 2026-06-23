import type { FC } from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Loading02 from '@/app/components/base/icons/line/loading-02'
import XClose from '@/app/components/base/icons/line/x-close'
import RefreshCcw01 from '@/app/components/base/icons/line/refresh-ccw-01'
import AlertTriangle from '@/app/components/base/icons/solid/alert-triangle'
import TooltipPlus from '@/app/components/base/tooltip-plus'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'
import ImagePreview from '@/app/components/base/image-uploader/image-preview'

interface ImageListProps {
  list: ImageFile[]
  readonly?: boolean
  onRemove?: (imageFileId: string) => void
  onReUpload?: (imageFileId: string) => void
  onImageLinkLoadSuccess?: (imageFileId: string) => void
  onImageLinkLoadError?: (imageFileId: string) => void
}

const ImageList: FC<ImageListProps> = ({
  list,
  readonly,
  onRemove,
  onReUpload,
  onImageLinkLoadSuccess,
  onImageLinkLoadError: _onImageLinkLoadError,
}) => {
  const { t } = useTranslation()
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const failedRemoteRef = useRef<Set<string>>(new Set())
  const [, forceUpdate] = useState(0)

  const handleImageLinkLoadSuccess = (item: ImageFile) => {
    failedRemoteRef.current.delete(item._id)
    if (item.type === TransferMethod.remote_url && onImageLinkLoadSuccess && item.progress !== -1) { onImageLinkLoadSuccess(item._id) }
  }
  const handleImageLinkLoadError = (item: ImageFile) => {
    failedRemoteRef.current.add(item._id)
    forceUpdate(n => n + 1)
  }

  return (
    <div className='flex flex-wrap'>
      {
        list.map(item => (
          <div
            key={item._id}
            className='group relative mr-1 border-[0.5px] border-black/5 rounded-lg'
          >
            {
              item.type === TransferMethod.local_file && item.progress !== 100 && (
                <>
                  <div
                    className='absolute inset-0 flex items-center justify-center z-[1] bg-black/30'
                    style={{ left: item.progress > -1 ? `${item.progress}%` : 0 }}
                  >
                    {
                      item.progress === -1 && (
                        <RefreshCcw01 className='w-5 h-5 text-white' onClick={() => onReUpload && onReUpload(item._id)} />
                      )
                    }
                  </div>
                  {
                    item.progress > -1 && (
                      <span className='absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-sm text-white mix-blend-lighten z-[1]'>{item.progress}%</span>
                    )
                  }
                </>
              )
            }
            {
              item.type === TransferMethod.remote_url && item.progress !== 100 && (
                <div className={`
                  absolute inset-0 flex items-center justify-center rounded-lg z-[1] border
                  ${item.progress === -1 ? 'bg-[#FEF0C7] border-[#DC6803]' : 'bg-black/[0.16] border-transparent'}
                `}>
                  {
                    item.progress > -1 && (
                      <Loading02 className='animate-spin w-5 h-5 text-white' />
                    )
                  }
                  {
                    item.progress === -1 && (
                      <TooltipPlus popupContent={t('common.imageUploader.pasteImageLinkInvalid')}>
                        <AlertTriangle className='w-4 h-4 text-[#DC6803]' />
                      </TooltipPlus>
                    )
                  }
                </div>
              )
            }
            <img
              className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-[0.5px] border-black/5 ${item.type === TransferMethod.remote_url && failedRemoteRef.current.has(item._id) ? 'hidden' : ''}`}
              alt=''
              onLoad={() => handleImageLinkLoadSuccess(item)}
              onError={() => handleImageLinkLoadError(item)}
              src={item.type === TransferMethod.remote_url ? item.url : item.base64Url}
              onClick={() => item.progress === 100 && setImagePreviewUrl((item.type === TransferMethod.remote_url ? item.url : item.base64Url) as string)}
            />
            {item.type === TransferMethod.remote_url && failedRemoteRef.current.has(item._id) && (
              <div className='w-16 h-16 rounded-lg flex items-center justify-center bg-dify-hover border-[0.5px] border-black/5 cursor-pointer' onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>
                <svg className='w-6 h-6 text-dify-text-tertiary' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' /></svg>
              </div>
            )}
            {
              !readonly && (
                <div
                  className={`
                    absolute z-10 -top-[9px] -right-[9px] items-center justify-center w-[18px] h-[18px] 
                    bg-white hover:bg-gray-50 border-[0.5px] border-black/[0.02] rounded-2xl shadow-lg
                    cursor-pointer
                    ${item.progress === -1 ? 'flex' : 'hidden group-hover:flex'}
                  `}
                  onClick={() => onRemove && onRemove(item._id)}
                >
                  <XClose className='w-3 h-3 text-gray-500' />
                </div>
              )
            }
          </div>
        ))
      }
      {
        imagePreviewUrl && (
          <ImagePreview
            url={imagePreviewUrl}
            onCancel={() => setImagePreviewUrl('')}
          />
        )
      }
    </div>
  )
}

export default ImageList
