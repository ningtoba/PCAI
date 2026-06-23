import type { FC, MouseEventHandler } from 'react'
import React from 'react'
import Spinner from '@/app/components/base/spinner'

export interface IButtonProps { type?: string, className?: string, disabled?: boolean, loading?: boolean, children: React.ReactNode, onClick?: MouseEventHandler<HTMLDivElement> }

const Button: FC<IButtonProps> = ({ type, disabled, children, className, onClick, loading = false }) => {
  let s = 'cursor-pointer'
  switch (type) {
    case 'link': s = disabled ? 'border border-dify-border bg-dify-hover cursor-not-allowed text-dify-text-tertiary' : 'border border-dify-border cursor-pointer text-dify-accent bg-transparent hover:bg-dify-hover'; break
    case 'primary': s = (disabled || loading) ? 'bg-primary-600/75 cursor-not-allowed text-white' : 'bg-primary-600 hover:bg-primary-700 cursor-pointer text-white'; break
    default: s = disabled ? 'border border-dify-border bg-dify-hover cursor-not-allowed text-dify-text-tertiary' : 'border border-dify-border cursor-pointer text-dify-text-tertiary hover:bg-dify-hover hover:text-dify-text-secondary'; break
  }
  return <div className={`flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-base ${s} ${className || ''}`} onClick={disabled ? undefined : onClick}>{children}<Spinner loading={loading} className='!text-white !h-3 !w-3 !border-2 !ml-1' /></div>
}

export default React.memo(Button)
