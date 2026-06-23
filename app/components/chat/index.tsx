'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'

export interface IChatProps { chatList: ChatItem[], feedbackDisabled?: boolean, isHideSendInput?: boolean, onFeedback?: (id: string, fb: any) => void, onSend?: (msg: string, files: VisionFile[]) => void, useCurrentUserAvatar?: boolean, isResponding?: boolean, controlClearQuery?: number, visionConfig?: VisionSettings, fileConfig?: FileUpload }

const Chat: FC<IChatProps> = ({ chatList, feedbackDisabled = true, isHideSendInput = false, onSend = () => {}, useCurrentUserAvatar, isResponding, controlClearQuery, visionConfig, fileConfig: _fileConfig }) => {
  const { t } = useTranslation(); const { notify } = Toast; const isUseInputMethod = useRef(false)
  const [query, setQuery] = React.useState(''); const qr = useRef('')
  const ch = (e: any) => { setQuery(e.target.value); qr.current = e.target.value }
  const le = (m: string) => notify({ type: 'error', message: m, duration: 3000 })
  const valid = () => { if (!qr.current?.trim()) { le(t('app.errorMessage.valueOfVarRequired')); return false }; return true }
  useEffect(() => { if (controlClearQuery) { setQuery(''); qr.current = '' } }, [controlClearQuery])
  const { files, onUpload, onRemove, onReUpload, onImageLinkLoadError, onImageLinkLoadSuccess, onClear } = useImageFiles()
  const send = () => {
    if (!valid()) { return }
    if (files.some(f => f.progress !== -1 && f.progress < 100)) { le(t('app.errorMessage.waitForFileUpload')); return }
    const imgs: VisionFile[] = files.filter(f => f.progress !== -1).map((f) => {
      const vf: VisionFile = { type: 'image', transfer_method: f.type, url: f.url }
      if (f.fileId) { vf.upload_file_id = f.fileId }
      return vf
    })
    onSend(qr.current, imgs)
    if (!files.find(f => f.type === TransferMethod.local_file && !f.fileId)) { if (files.length) { onClear() } if (!isResponding) { setQuery(''); qr.current = '' } }
  }
  const ku = (e: any) => { if (e.code === 'Enter') { e.preventDefault(); if (!e.shiftKey && !isUseInputMethod.current) { send() } } }
  const kd = (e: any) => { isUseInputMethod.current = e.nativeEvent.isComposing; if (e.code === 'Enter' && !e.shiftKey) { setQuery(query.replace(/\n$/, '')); qr.current = qr.current.replace(/\n$/, ''); e.preventDefault() } }
  const sc = (suggestion: string) => { setQuery(suggestion); qr.current = suggestion; send() }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[768px] mx-auto px-8 pt-4 pb-2">
          {chatList.map((item) => {
            if (item.isAnswer) {
              const last = item.id === chatList[chatList.length - 1]?.id
              return <Answer key={item.id} item={item} feedbackDisabled={feedbackDisabled} isResponding={isResponding && last} suggestionClick={sc} />
            }
            return <Question key={item.id} id={item.id} content={item.content} useCurrentUserAvatar={useCurrentUserAvatar} imgSrcs={item.message_files?.length ? item.message_files.map(f => f.url) : []} />
          })}
        </div>
      </div>

      {/* Input area — always at bottom, no fixed positioning */}
      {!isHideSendInput && (
        <div className="shrink-0 pb-4 px-4" style={{ background: 'linear-gradient(180deg, rgba(29,29,32,0) 0%, rgba(29,29,32,0.9) 50%)' }}>
          <div className="max-w-[768px] mx-auto">
            <div className='relative p-[5.5px] max-h-[150px] bg-dify-input border border-dify-border rounded-xl overflow-y-auto'>
              {visionConfig?.enabled && <><div className='absolute bottom-2 left-2 flex items-center'><ChatImageUploader settings={visionConfig} onUpload={onUpload} disabled={files.length >= visionConfig.number_limits} /><div className='mx-1 w-[1px] h-4 bg-white/10' /></div><div className='pl-[52px]'><ImageList list={files} onRemove={onRemove} onReUpload={onReUpload} onImageLinkLoadSuccess={onImageLinkLoadSuccess} onImageLinkLoadError={onImageLinkLoadError} /></div></>}

              <Textarea className={`block w-full px-2 pr-[82px] py-[7px] leading-5 max-h-none text-base text-dify-text-primary outline-none appearance-none resize-none bg-transparent placeholder:text-dify-text-placeholder ${visionConfig?.enabled && 'pl-12'}`} value={query} onChange={ch} onKeyUp={ku} onKeyDown={kd} autoSize placeholder={'Send a message (Enter to send, Shift+Enter for new line)'} />
              <div className="absolute bottom-2 right-6 flex items-center h-8">
                <Tooltip selector='send-tip' htmlContent={<div><div>{t('common.operation.send')} Enter</div><div>{t('common.operation.lineBreak')} Shift Enter</div></div>}>
                  <div className={`${s.sendBtn} w-8 h-8 cursor-pointer rounded-md`} onClick={send}></div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default React.memo(Chat)
