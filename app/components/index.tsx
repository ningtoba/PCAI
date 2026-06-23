'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import DocumentManagement from '@/app/components/document-panel/document-management'
import { fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage } from '@/service'
import type { ChatItem, ConversationItem, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'

export interface IMainProps { params: any }

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID && API_KEY
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat')
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({ enabled: false, number_limits: 2, detail: Resolution.low, transfer_methods: [TransferMethod.local_file] })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()

  useEffect(() => { document.title = 'CTC RAG' }, [])
  useEffect(() => { setAutoFreeze(false); return () => { setAutoFreeze(true) } }, [])

  const { conversationList, setConversationList, currConversationId, getCurrConversationId, setCurrConversationId, getConversationIdFromStorage, isNewConversation, currConversationInfo, currInputs, setCurrInputs, setNewConversationInfo, setExistConversationInfo } = useConversation()
  const [, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const { notify } = Toast

  // Load chat history when conversation changes
  useEffect(() => {
    if (!inited) { return }
    if (isNewConversation) {
      setChatList(generateNewChatListWithOpenStatement())
      return
    }
    if (!currConversationId || currConversationId === '-1') { return }
    if (isResponding) { return }

    const item = conversationList.find(i => i.id === currConversationId)
    const inputs = item?.inputs || {}
    const intro = item?.introduction || ''
    setCurrInputs(inputs as any)
    setExistConversationInfo({ name: item?.name || '', introduction: intro, suggested_questions: suggestedQuestions })

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }

    fetchChatList(currConversationId).then((res: any) => {
      const list: ChatItem[] = generateNewChatListWithOpenStatement(intro, inputs)
      res.data.forEach((item: any) => {
        list.push({ id: `question-${item.id}`, content: item.query, isAnswer: false, message_files: item.message_files?.filter((f: any) => f.belongs_to === 'user') || [] })
        list.push({ id: item.id, content: item.answer, agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files), feedback: item.feedback, isAnswer: true, message_files: item.message_files?.filter((f: any) => f.belongs_to === 'assistant') || [] })
      })
      setChatList(list)
    })
  }, [inited, currConversationId, isNewConversation, isResponding, conversationList, suggestedQuestions])

  const handleConversationIdChange = (id: string) => {
    if (id === '-1') { createNewChat(); setConversationIdChangeBecauseOfNew(true) } else { setConversationIdChangeBecauseOfNew(false) }
    setCurrConversationId(id, APP_ID); setActiveTab('chat'); if (isMobile) { setSidebarOpen(false) }
  }

  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const skipNextFetchRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [chatList, currConversationId])

  const createNewChat = () => { if (conversationList.some(i => i.id === '-1')) { return } setConversationList(produce(conversationList, (d) => { d.unshift({ id: '-1', name: t('app.chat.newChatDefaultName'), inputs: currInputs, introduction: conversationIntroduction, suggested_questions: suggestedQuestions }) })) }
  const generateNewChatListWithOpenStatement = (introduction?: string, _inputs?: Record<string, any> | null) => { const intro = introduction || conversationIntroduction || ''; return intro ? [{ id: `${Date.now()}`, content: intro, isAnswer: true, feedbackDisabled: true, isOpeningStatement: isShowPrompt, suggestedQuestions }] : [] }

  useEffect(() => {
    if (!hasSetAppConfig) { setAppUnavailable(true); return }
    (async () => {
      try {
        const [cd, ap] = await Promise.all([fetchConversations(), fetchAppParams()])
        const { data: convs, error } = cd as { data: ConversationItem[], error: string }
        if (error) { Toast.notify({ type: 'error', message: error }); throw new Error(error) }
        const cid = getConversationIdFromStorage(APP_ID)
        const cur = convs.find(i => i.id === cid)
        const isExisting = !!cur
        const { opening_statement: intro, file_upload, system_parameters, suggested_questions: sq = [] }: any = ap
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({ name: t('app.chat.newChatDefaultName'), introduction: intro, suggested_questions: sq })
        if (isExisting) { setExistConversationInfo({ name: cur.name || t('app.chat.newChatDefaultName'), introduction: intro, suggested_questions: sq }) }
        setPromptConfig({ prompt_template: promptTemplate, prompt_variables: [] } as PromptConfig)
        const fe = !!file_upload?.enabled
        setVisionConfig({ ...file_upload?.image, enabled: !!(fe && file_upload?.image?.enabled), image_file_size_limit: system_parameters?.system_parameters || 0 })
        setFileConfig({ enabled: fe, allowed_file_types: file_upload?.allowed_file_types, allowed_file_extensions: file_upload?.allowed_file_extensions, allowed_file_upload_methods: file_upload?.allowed_file_upload_methods, number_limits: file_upload?.number_limits, fileUploadConfig: file_upload?.fileUploadConfig })
        setConversationList(convs as ConversationItem[])
        if (isExisting) {
          setCurrConversationId(cid, APP_ID, false)
          // Fetch chat history directly — bypass effect timing issues
          fetchChatList(cid).then((res: any) => {
            const list: ChatItem[] = intro ? [{ id: `${Date.now()}`, content: intro, isAnswer: true, feedbackDisabled: true, isOpeningStatement: isShowPrompt, suggestedQuestions: sq }] : []
            res.data.forEach((item: any) => {
              list.push({ id: `question-${item.id}`, content: item.query, isAnswer: false, message_files: item.message_files?.filter((f: any) => f.belongs_to === 'user') || [] })
              list.push({ id: item.id, content: item.answer, agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files), feedback: item.feedback, isAnswer: true, message_files: item.message_files?.filter((f: any) => f.belongs_to === 'assistant') || [] })
            })
            setChatList(list)
          })
        } else { createNewChat(); setConversationIdChangeBecauseOfNew(true) }
        setInited(true)
      } catch (e: any) { if (e.status === 404) { setAppUnavailable(true) } else { setIsUnknownReason(true); setAppUnavailable(true) } }
    })()
  }, [])

  const updateQA = ({ ri, qi, pi, qi2 }: { ri: ChatItem, qi: string, pi: string, qi2: ChatItem }) => { setChatList(produce(getChatList().filter(i => i.id !== ri.id && i.id !== pi), (d) => { if (!d.find(i => i.id === qi)) { d.push({ ...qi2 }) } d.push({ ...ri }) })) }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) { notify({ type: 'info', message: t('app.errorMessage.waitForResponse') }); return }
    const si: Record<string, any> = {}
    if (currInputs) { Object.keys(currInputs).forEach((k) => { const v = currInputs[k]; if (v?.supportFileType) { si[k] = { type: 'image', transfer_method: v.transferMethod, url: v.url, upload_file_id: v.id } } else if (v?.[0]?.supportFileType) { si[k] = v.map((x: any) => ({ type: 'image', transfer_method: x.transferMethod, url: x.url, upload_file_id: x.id })) } else { si[k] = v } }) }
    const data: Record<string, any> = { inputs: si, query: message, conversation_id: isNewConversation ? null : currConversationId }
    if (files?.length) { data.files = files.map(f => f.transfer_method === TransferMethod.local_file ? { ...f, url: '' } : f) }
    const qid = `question-${Date.now()}`; const qi = { id: qid, content: message, isAnswer: false, message_files: (files || []).filter((f: any) => f.type === 'image') }
    const pid = `answer-placeholder-${Date.now()}`; setChatList([...getChatList(), qi, { id: pid, content: '', isAnswer: true }])
    let isAgent = false; const ri: ChatItem = { id: `${Date.now()}`, content: '', agent_thoughts: [], message_files: [], isAnswer: true }; let hasId = false
    const prevCid = getCurrConversationId() || '-1'; let newCid = ''
    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: () => {},
      onData: (msg, isFirst, { conversationId: cid, messageId }: any) => { if (!isAgent) { ri.content += msg } else { const lt = ri.agent_thoughts?.[ri.agent_thoughts.length - 1]; if (lt) { lt.thought += msg } }; if (messageId && !hasId) { ri.id = messageId; hasId = true }; if (isFirst && cid) { newCid = cid } if (prevCid !== getCurrConversationId()) { return } updateQA({ ri, qi: qid, pi: pid, qi2: qi }) },
      async onCompleted(hasErr) { if (hasErr) { return } if (getConversationIdChangeBecauseOfNew()) { const { data: ac }: any = await fetchConversations(); const n: any = await generationConversationName(ac[0].id); setConversationList(produce(ac, (d: any) => { d[0].name = n.name })) }; skipNextFetchRef.current = true; setCurrConversationId(newCid, APP_ID, true); setRespondingFalse() },
      onFile(file) { const lt = ri.agent_thoughts?.[ri.agent_thoughts.length - 1]; if (lt) { lt.message_files = [...(lt as any).message_files, { ...file }] } updateQA({ ri, qi: qid, pi: pid, qi2: qi }) },
      onThought(th) { isAgent = true; const r = ri as any; if (th.message_id && !hasId) { r.id = th.message_id; hasId = true }; if (!r.agent_thoughts.length) { r.agent_thoughts.push(th) } else { const lt = r.agent_thoughts[r.agent_thoughts.length - 1]; if (lt.id === th.id) { th.thought = lt.thought; th.message_files = lt.message_files; ri.agent_thoughts![ri.agent_thoughts.length - 1] = th } else { ri.agent_thoughts!.push(th) } }; if (prevCid !== getCurrConversationId()) { return false } updateQA({ ri, qi: qid, pi: pid, qi2: qi }) },
      onMessageEnd: (me) => { if (me.metadata?.annotation_reply) { ri.annotation = ({ id: me.metadata.annotation_reply.id, authorName: me.metadata.annotation_reply.account.name } as AnnotationType) } setChatList(produce(getChatList().filter(i => i.id !== ri.id && i.id !== pid), (d) => { if (!d.find(i => i.id === qid)) { d.push({ ...qi }) } d.push({ ...ri }) })) },
      onMessageReplace: (mr) => { setChatList(produce(getChatList(), (d) => { const c = d.find(i => i.id === mr.id); if (c) { c.content = mr.answer } })) },
      onError() { setRespondingFalse(); setChatList(produce(getChatList(), (d) => { d.splice(d.findIndex(i => i.id === pid), 1) })) },
      onWorkflowStarted: ({ workflow_run_id }) => { ri.workflow_run_id = workflow_run_id; ri.workflowProcess = { status: WorkflowRunningStatus.Running, tracing: [] }; setChatList(produce(getChatList(), (d) => { const i = d.findIndex(x => x.id === ri.id); d[i] = { ...d[i], ...ri } })) },
      onWorkflowFinished: ({ data: d }) => { ri.workflowProcess!.status = d.status as WorkflowRunningStatus; setChatList(produce(getChatList(), (d) => { const i = d.findIndex(x => x.id === ri.id); d[i] = { ...d[i], ...ri } })) },
      onNodeStarted: ({ data: d }) => { ri.workflowProcess!.tracing!.push(d as any); setChatList(produce(getChatList(), (d) => { const i = d.findIndex(x => x.id === ri.id); d[i] = { ...d[i], ...ri } })) },
      onNodeFinished: ({ data: d }) => { const ci = ri.workflowProcess!.tracing!.findIndex(x => x.node_id === d.node_id); ri.workflowProcess!.tracing[ci] = d as any; setChatList(produce(getChatList(), (d) => { const i = d.findIndex(x => x.id === ri.id); d[i] = { ...d[i], ...ri } })) },
    })
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} /> }
  if (!APP_ID || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  return (
    <div className="flex h-screen bg-dify-body">
      {/* Sidebar — overlay on mobile, inline on desktop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[260px] bg-gradient-to-b from-[#222225E6] to-[#1D1D20E6] border-r border-dify-border-section">
            <Sidebar list={conversationList} onCurrentIdChange={handleConversationIdChange} currentId={currConversationId} />
          </div>
        </div>
      )}

      {!isMobile && (
        <div className={`shrink-0 flex flex-col p-1 pr-0 transition-all duration-200 ${sidebarOpen ? 'w-[236px]' : 'w-0 overflow-hidden p-0'}`}>
          <div className="flex-1 rounded-xl bg-gradient-to-b from-[#222225E6] to-[#1D1D20E6] border border-dify-border-section overflow-hidden">
            <Sidebar list={conversationList} onCurrentIdChange={handleConversationIdChange} currentId={currConversationId} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="relative grow p-2 min-w-0">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-dify-border-section bg-gradient-to-b from-[#222225E6] to-[#1D1D20E6]">
          {/* Top bar */}
          <div className="shrink-0 flex items-center h-12 px-4 border-b border-dify-border-section gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md text-dify-text-tertiary hover:text-dify-text-secondary hover:bg-dify-hover transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => { setActiveTab('chat'); if (isMobile) { setSidebarOpen(false) } }} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'chat' ? 'bg-dify-hover text-dify-text-primary' : 'text-dify-text-tertiary hover:text-dify-text-secondary'}`}>Chat</button>
              <button onClick={() => setActiveTab('documents')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'documents' ? 'bg-dify-hover text-dify-text-primary' : 'text-dify-text-tertiary hover:text-dify-text-secondary'}`}>Documents</button>
            </div>
            <div className="flex-1" />
            <div className="text-sm font-semibold text-dify-text-secondary">CTC RAG</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0">
            {activeTab === 'chat'
              ? <Chat chatList={chatList} onSend={handleSend} onFeedback={() => {}} feedbackDisabled={true} isResponding={isResponding} visionConfig={visionConfig} fileConfig={fileConfig} />
              : <div className="h-full overflow-y-auto px-3 sm:px-8 py-4 sm:py-6"><DocumentManagement /></div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Main)
