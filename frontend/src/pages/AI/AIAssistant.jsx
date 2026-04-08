import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Trash2, Bot, User, Sparkles, FileText, Loader2, MessageSquare } from 'lucide-react'
import { aiApi } from '../../services/api'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import toast from 'react-hot-toast'

const QUICK_PROMPTS = [
  { label: '📊 Business Analysis', prompt: 'Give me a comprehensive analysis of my business performance. Which business is performing better and what should I focus on?' },
  { label: '🏠 Ghana RE Market', prompt: 'What are the current real estate market trends in Ghana? What rental rates should I be charging in Accra/Kumasi?' },
  { label: '🌾 SA Market Prices', prompt: 'What are typical vegetable prices at the Johannesburg Fresh Produce Market and Manzini market right now? Which crops are most profitable for SA export?' },
  { label: '📋 Tenancy Agreement', prompt: 'Generate a standard tenancy agreement template for a residential apartment in Accra, Ghana. Include all standard Ghana-specific legal clauses.' },
  { label: '🌱 Crop Advice', prompt: 'What vegetables should I plant in Eswatini for the next season to maximize profit in the South African market? Consider the subtropical highland climate.' },
  { label: '📈 Profit Tips', prompt: 'How can I improve the profitability of both my Ghana real estate and Eswatini farm businesses? Give me specific, actionable strategies.' },
  { label: '🏆 SIZA Certification', prompt: 'Walk me through the SIZA certification process for my Eswatini farm. What do I need to do to get certified for the South African market?' },
  { label: '💰 Cash Flow Help', prompt: 'How should I manage cash flow between my two businesses in different currencies? Any strategies to minimize currency risk?' },
]

function MarkdownMessage({ content }) {
  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs font-mono">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br />')
  }

  return (
    <div
      className="prose-chat text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${formatText(content)}</p>` }}
    />
  )
}

export default function AIAssistant() {
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [includeContext, setIncludeContext] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportModal, setReportModal] = useState(false)
  const [report, setReport] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const loadConversations = async () => {
    try {
      const data = await aiApi.getConversations()
      setConversations(data)
    } catch {}
  }

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async (id) => {
    try {
      const data = await aiApi.getConversation(id)
      setActiveConvId(id)
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch { toast.error('Failed to load conversation') }
  }

  const newConversation = () => {
    setActiveConvId(null)
    setMessages([])
    inputRef.current?.focus()
  }

  const sendMessage = async (messageText) => {
    const msg = (messageText || input).trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)

    const userMessage = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMessage])

    try {
      const data = await aiApi.chat({
        message: msg,
        conversation_id: activeConvId,
        include_business_context: includeContext,
      })
      setMessages(Array.isArray(data.messages) ? data.messages : [...messages, userMessage, { role: 'assistant', content: data.reply }])
      if (!activeConvId && data.conversation_id) {
        setActiveConvId(data.conversation_id)
        loadConversations()
      }
    } catch (err) {
      toast.error(err.message || 'AI request failed')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  const deleteConversation = async () => {
    setDeleting(true)
    try {
      await aiApi.deleteConversation(deleteId)
      toast.success('Conversation deleted')
      setDeleteId(null)
      if (activeConvId === deleteId) { setActiveConvId(null); setMessages([]) }
      loadConversations()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const generateReport = async () => {
    setGeneratingReport(true)
    setReportModal(true)
    setReport('')
    try {
      const data = await aiApi.generateReport()
      setReport(data.report)
    } catch { toast.error('Failed to generate report') }
    finally { setGeneratingReport(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 animate-fade-in">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 card overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <button onClick={newConversation} className="w-full btn-primary text-sm py-2">
            <Plus size={14} /> New Chat
          </button>
        </div>
        <div className="p-2">
          <button onClick={generateReport} disabled={generatingReport} className="w-full btn-secondary text-xs py-1.5 mb-2">
            <FileText size={12} className={generatingReport ? 'animate-pulse' : ''} />
            {generatingReport ? 'Generating...' : 'AI Business Report'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No conversations yet</p>
          )}
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${activeConvId === conv.id ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <MessageSquare size={13} className={activeConvId === conv.id ? 'text-orange-500' : 'text-gray-400'} />
              <span className="flex-1 text-xs truncate text-gray-700 dark:text-gray-300">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(conv.id) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col card overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Business Assistant</h3>
              <p className="text-[10px] text-gray-500">Ghana Real Estate · Eswatini Farm · African Markets Expert</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={includeContext} onChange={e => setIncludeContext(e.target.checked)} className="rounded" />
            Include business data
          </label>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 mb-4">
                <Sparkles size={28} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ask me anything</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                I'm your AI expert for Ghana real estate, Eswatini farming, SA markets, and African business operations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qp.prompt)}
                    className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-300 dark:hover:border-orange-700 transition-all text-xs text-gray-700 dark:text-gray-300"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-50 dark:bg-gray-800 rounded-tl-sm'
              }`}>
                {msg.role === 'user'
                  ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  : <MarkdownMessage content={msg.content} />
                }
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-blue-600" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center py-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              className="flex-1 form-input resize-none max-h-32"
              rows={1}
              placeholder="Ask about your business, get advice, generate documents..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Powered by Claude AI · Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReportModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold">AI Business Report</h2>
              <div className="flex gap-2">
                {report && (
                  <button
                    onClick={() => {
                      const blob = new Blob([report], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url; a.download = 'business-report.txt'; a.click()
                    }}
                    className="btn-primary text-sm py-1.5"
                  >
                    <FileText size={14} /> Download
                  </button>
                )}
                <button onClick={() => setReportModal(false)} className="btn-secondary text-sm py-1.5">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {generatingReport ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-3 text-gray-500">
                    <Loader2 size={24} className="animate-spin text-orange-500" />
                    <p>AI is analyzing your business data and generating your report...</p>
                  </div>
                </div>
              ) : (
                <MarkdownMessage content={report} />
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteConversation} title="Delete Conversation" message="Delete this conversation? This cannot be undone." loading={deleting} />
    </div>
  )
}
