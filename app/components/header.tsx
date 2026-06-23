import type { FC } from 'react'
import React from 'react'
import { Bars3Icon, PencilSquareIcon } from '@heroicons/react/24/solid'

export interface IHeaderProps { title: string, isMobile?: boolean, onShowSideBar?: () => void, onCreateNewChat?: () => void }

const Header: FC<IHeaderProps> = ({ title, isMobile, onShowSideBar, onCreateNewChat }) => (
  <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-dify-body border-b border-dify-border-section">
    {isMobile ? <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onShowSideBar?.()}><Bars3Icon className="h-4 w-4 text-dify-text-tertiary" /></div> : <div></div>}
    <div className='flex items-center space-x-2'><div className="text-sm text-dify-text-secondary font-bold">{title}</div></div>
    {isMobile ? <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()}><PencilSquareIcon className="h-4 w-4 text-dify-text-tertiary" /></div> : <div></div>}
  </div>
)

export default React.memo(Header)
