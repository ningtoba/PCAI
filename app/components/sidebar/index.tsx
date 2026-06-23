import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatBubbleOvalLeftEllipsisIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import type { ConversationItem } from '@/types/app'

function cn(...c: any[]) { return c.filter(Boolean).join(' ') }
const MAX = 20

export interface ISidebarProps { currentId: string, onCurrentIdChange: (id: string) => void, list: ConversationItem[] }

const Sidebar: FC<ISidebarProps> = ({ currentId, onCurrentIdChange, list }) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-full">
      {/* New Chat */}
      {list.length < MAX && (
        <div className="shrink-0 px-3 pt-3 pb-1">
          <button type="button" onClick={() => onCurrentIdChange('-1')} className="flex w-full items-center rounded-lg px-2 py-1.5 text-sm font-medium text-dify-text-secondary hover:bg-dify-hover transition-colors">
            <PencilSquareIcon className="mr-2 h-4 w-4 text-dify-text-tertiary" />{t('app.chat.newChat')}
          </button>
        </div>
      )}

      {/* Separator */}
      <div className="shrink-0 px-3 py-1"><div className="border-t border-dify-border-section" /></div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {list.map((item) => {
          const cur = item.id === currentId
          const Icon = cur ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <div key={item.id} onClick={() => onCurrentIdChange(item.id)} className={cn(cur ? 'bg-dify-bubble-user text-dify-accent' : 'text-dify-text-secondary hover:bg-dify-hover hover:text-dify-text-primary', 'group flex items-center rounded-lg px-2 py-1.5 text-sm font-medium cursor-pointer transition-colors')}>
              <Icon className={cn(cur ? 'text-dify-accent' : 'text-dify-text-tertiary group-hover:text-dify-text-secondary', 'mr-2 h-4 w-4 flex-shrink-0')} aria-hidden="true" />{item.name}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
export default React.memo(Sidebar)
