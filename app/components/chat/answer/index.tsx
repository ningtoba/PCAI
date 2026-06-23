'use client'
import type { FC } from 'react'
import type { ChatItem } from '@/types/app'
import React from 'react'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import LoadingAnim from '../loading-anim'
import s from '../style.module.css'
import Thought from '../thought'

interface IAnswerProps { item: ChatItem, feedbackDisabled: boolean, isResponding?: boolean, suggestionClick?: (s: string) => void }

const Answer: FC<IAnswerProps> = ({ item, isResponding, suggestionClick = () => {} }) => {
  const { id, content, agent_thoughts, workflowProcess, suggestedQuestions = [], annotation } = item
  const isAgent = !!(agent_thoughts?.length)

  return (
    <div key={id} className="mb-2 last:mb-0">
      <div className="flex items-start">
        <div className={`${s.answerIcon} w-10 h-10 shrink-0`}>
          {isResponding && <div className={s.typeingIcon}><LoadingAnim type="avatar" /></div>}
        </div>
        <div className="max-w-[calc(100%-3rem)]">
          <div className="relative text-sm">
            <div className={`ml-2 px-4 py-3 bg-dify-bubble-answer rounded-2xl text-dify-text-primary ${workflowProcess && 'min-w-[480px]'}`}>
              {workflowProcess && <WorkflowProcess data={workflowProcess} hideInfo />}
              {(isResponding && (isAgent ? (!content && !agent_thoughts?.filter(t => !!t.thought || !!t.tool).length) : !content))
                ? <div className="flex items-center justify-center w-6 h-5"><LoadingAnim type="text" /></div>
                : isAgent
                  ? <div>{agent_thoughts?.map((t, i) => <div key={i}>{t.thought && <StreamdownMarkdown content={t.thought} />}{!!t.tool && <Thought thought={t} allToolIcons={{}} isFinished={!!t.observation || !isResponding} />}</div>)}</div>
                  : <StreamdownMarkdown content={content} />
              }
              {suggestedQuestions.length > 0 && <div className="mt-3"><div className="flex gap-1 flex-wrap">{suggestedQuestions.map((sq, i) => <button key={i} type="button" className="text-sm text-dify-accent hover:underline" onClick={() => suggestionClick(sq)}>{sq}</button>)}</div></div>}
              {annotation?.id && annotation.authorName && <div className="mt-1.5 text-xs text-dify-text-tertiary">Edited by {annotation.authorName}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default React.memo(Answer)
