'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & { imgSrcs?: string[] }

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, imgSrcs }) => (
  <div className='flex items-start justify-end mt-5 mb-2 last:mb-0' key={id}>
    <div>
      <div className={`${s.question} relative text-sm`}>
        <div className='mr-2 px-4 py-3 bg-dify-bubble-user rounded-2xl'>
          {imgSrcs?.length ? <ImageGallery srcs={imgSrcs} /> : null}
          <div className="text-dify-text-primary"><StreamdownMarkdown content={content} /></div>
        </div>
      </div>
    </div>
    {useCurrentUserAvatar ? <div className='w-10 h-10 shrink-0 leading-10 text-center mr-2 rounded-full bg-primary-600 text-white'>U</div> : <div className={`${s.questionIcon} w-10 h-10 shrink-0`}></div>}
  </div>
)

export default React.memo(Question)
