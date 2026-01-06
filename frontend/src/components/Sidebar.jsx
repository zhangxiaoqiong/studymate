import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { askFollowupQuestionStream } from '../services/api'

const Sidebar = ({
  keyword,
  explanation,
  loading,
  onClose,
  isSaved,
  savedExplanations,
  onSave,
  onDelete,
  onRefresh,
  onUpdateSavedExplanation,
  width = 700,
  onResizeStart,
}) => {
  const [mode, setMode] = useState(isSaved ? 'saved' : 'new')
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [questionInput, setQuestionInput] = useState('')
  const [showConversations, setShowConversations] = useState(false)
  const [regeneratingConvIndex, setRegeneratingConvIndex] = useState(null)

  useEffect(() => {
    setMode(savedExplanations[keyword] ? 'saved' : 'new')
  }, [keyword, savedExplanations])

  const formatDate = (ts) => {
    const diff = Date.now() - ts
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    return h < 1 ? '刚刚' : h < 24 ? `${h}小时前` : d < 7 ? `${d}天前` : new Date(ts).toLocaleDateString('zh-CN')
  }

  const currentExplanation = mode === 'saved' ? savedExplanations[keyword]?.explanation : explanation

  const handleAskQuestion = async () => {
    if (!questionInput.trim()) return
    setAskingQuestion(true)
    try {
      const result = await askFollowupQuestionStream(
        keyword,
        savedExplanations[keyword]?.explanation || explanation,
        questionInput,
        () => {}
      )
      const updated = {
        ...savedExplanations[keyword],
        conversations: [...(savedExplanations[keyword]?.conversations || []), { question: questionInput, answer: result.answer, askedAt: Date.now() }],
      }
      onUpdateSavedExplanation(keyword, updated)
      setQuestionInput('')
    } catch (e) {
      alert('提问失败')
    } finally {
      setAskingQuestion(false)
    }
  }

  return (
    <div className="fixed right-0 top-0 h-screen bg-white shadow-2xl z-50 flex flex-col border-l" style={{ width: `${width}px` }}>
      {onResizeStart && <div onMouseDown={e => { e.preventDefault(); onResizeStart(e.clientX) }} className="absolute left-0 top-0 w-1 h-full bg-gray-300 hover:bg-blue-500 cursor-col-resize" />}
      
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div>
          <h2 className="text-xl font-bold">{keyword}</h2>
          <p className="text-sm text-gray-600 mt-1">{mode === 'saved' ? '已保存的解释' : '详细解释'}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={handleRefresh} className="p-2 hover:bg-blue-50 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
          {mode === 'new' ? <button onClick={() => { onSave(keyword, explanation); setMode('saved') }} className="p-2 hover:bg-blue-50 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /></svg></button> : <button onClick={() => onDelete(keyword)} className="p-2 hover:bg-red-50 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && <div className="flex justify-center items-center h-full"><div className="spinner"></div><p>AI 正在思考...</p></div>}
        {!loading && !currentExplanation && <div className="text-center"><p className="text-gray-500">选择关键词查看解释</p></div>}
        {!loading && currentExplanation && (
          <>
            <div className="bg-blue-50 p-4 rounded mb-4"><ReactMarkdown remarkPlugins={[remarkGfm]}>{currentExplanation}</ReactMarkdown></div>
            {mode === 'saved' && savedExplanations[keyword]?.conversations?.length > 0 && (
              <div className="mb-4">
                <button onClick={() => setShowConversations(!showConversations)} className="text-blue-600 text-sm font-medium mb-2">💬 {savedExplanations[keyword].conversations.length} 个对话</button>
                {showConversations && <div className="space-y-2">{savedExplanations[keyword].conversations.map((c, i) => <div key={i} className="bg-gray-50 p-3 rounded"><p className="text-sm font-medium">Q: {c.question}</p><p className="text-sm text-gray-700 mt-1">A: {c.answer}</p></div>)}</div>}
              </div>
            )}
            {mode === 'saved' && <div className="border-t pt-4"><input type="text" value={questionInput} onChange={e => setQuestionInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAskQuestion()} placeholder="提问..." className="w-full px-2 py-1 border rounded text-sm mb-2" /><button onClick={handleAskQuestion} disabled={askingQuestion} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">提问</button></div>}
          </>
        )}
      </div>
    </div>
  )
}

const handleRefresh = () => {}
export default Sidebar
