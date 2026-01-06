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
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [regeneratingAnswer, setRegeneratingAnswer] = useState('')

  useEffect(() => {
    setMode(savedExplanations[keyword] ? 'saved' : 'new')
  }, [keyword, savedExplanations])

  const formatDate = (ts) => {
    const date = new Date(ts)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const currentExplanation = mode === 'saved' ? savedExplanations[keyword]?.explanation : explanation

  const handleAskQuestion = async () => {
    if (!questionInput.trim()) return
    setAskingQuestion(true)
    setStreamingAnswer('')
    try {
      const result = await askFollowupQuestionStream(
        keyword,
        savedExplanations[keyword]?.explanation || explanation,
        questionInput,
        (chunk) => setStreamingAnswer(prev => prev + chunk)
      )
      const updated = {
        ...savedExplanations[keyword],
        conversations: [...(savedExplanations[keyword]?.conversations || []), { question: questionInput, answer: result.answer, askedAt: Date.now() }],
      }
      onUpdateSavedExplanation(keyword, updated)
      setQuestionInput('')
      setStreamingAnswer('')
    } catch (e) {
      alert('提问失败')
    } finally {
      setAskingQuestion(false)
    }
  }

  const handleRegenerateAnswer = async (index) => {
    const conversation = savedExplanations[keyword]?.conversations[index]
    if (!conversation) return

    setRegeneratingIndex(index)
    setRegeneratingAnswer('')
    try {
      const result = await askFollowupQuestionStream(
        keyword,
        savedExplanations[keyword]?.explanation || explanation,
        conversation.question,
        (chunk) => setRegeneratingAnswer(prev => prev + chunk)
      )
      const updated = {
        ...savedExplanations[keyword],
        conversations: savedExplanations[keyword].conversations.map((c, i) =>
          i === index ? { ...c, answer: result.answer, askedAt: Date.now() } : c
        ),
      }
      onUpdateSavedExplanation(keyword, updated)
    } catch (e) {
      alert('重新生成失败')
    } finally {
      setRegeneratingIndex(null)
      setRegeneratingAnswer('')
    }
  }

  const handleDeleteConversation = (index) => {
    if (window.confirm('确认删除此对话？')) {
      const updated = {
        ...savedExplanations[keyword],
        conversations: savedExplanations[keyword].conversations.filter((_, i) => i !== index),
      }
      onUpdateSavedExplanation(keyword, updated)
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
          {mode === 'new' && <button onClick={() => { onSave(keyword, explanation); setMode('saved') }} className="p-2 hover:bg-blue-50 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /></svg></button>}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>

      {mode === 'saved' && (
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'explanation'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            简要解释
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'discussion'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            💬 问答讨论 {savedExplanations[keyword]?.conversations?.length > 0 && <span className="inline-block bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">{savedExplanations[keyword].conversations.length}</span>}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {!loading && !currentExplanation && <div className="text-center"><p className="text-gray-500">选择关键词查看解释</p></div>}

        {currentExplanation && activeTab === 'explanation' && (
          <>
            <div className="relative bg-white p-3 rounded-lg border border-gray-200 markdown-content conversation-answer mb-4 text-base text-gray-800">
              <button onClick={onRefresh} disabled={loading} className={`absolute top-2 right-2 p-1 hover:bg-gray-100 rounded transition-colors ${loading ? "animate-spin" : ""}`} title="刷新解释"><svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentExplanation}</ReactMarkdown>
            </div>
            {loading && <p className="text-sm text-gray-500 mt-2 ml-4">⏳ AI 正在生成中...</p>}
            {!loading && mode === 'new' && <p className="text-sm text-blue-600 mt-2 ml-4">💡 点击右上角保存按钮以保存此解释</p>}
          </>
        )}

        {mode === 'saved' && activeTab === 'discussion' && (
          <>
            <div className="space-y-3 mb-4">
              {savedExplanations[keyword]?.conversations?.length > 0 ? (
                savedExplanations[keyword].conversations.map((c, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-orange-50 px-3 py-1.5 border-b border-orange-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-orange-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                        <p className="text-sm font-medium text-orange-900 flex-1">{c.question}</p>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(c.askedAt)}</p>
                    </div>
                    <div className="relative bg-blue-50 px-3 py-1 border-t border-blue-100">
                      <div className="absolute top-1 right-2 flex gap-1">
                        <button
                          onClick={() => handleRegenerateAnswer(i)}
                          disabled={regeneratingIndex === i}
                          className={`p-1 hover:bg-blue-100 rounded transition-colors ${regeneratingIndex === i ? 'animate-spin bg-blue-100' : 'hover:bg-blue-100'}`}
                          title="重新生成"
                        >
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteConversation(i)}
                          disabled={regeneratingIndex === i}
                          className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                          title="删除对话"
                        >
                          <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <p className="text-xs font-medium text-blue-900 pr-20">📝 回答</p>
                    </div>
                    <div className="p-2">
                      <div className="text-sm text-gray-800 markdown-content conversation-answer">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {regeneratingIndex === i ? regeneratingAnswer : c.answer}
                        </ReactMarkdown>
                      </div>
                      {regeneratingIndex === i && (
                        <p className="text-xs text-blue-500 mt-1">⏳ 正在重新生成...</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 text-sm py-8">在下方输入框开始提问吧</p>
              )}

              {askingQuestion && streamingAnswer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden animate-pulse">
                  <div className="bg-blue-100 px-3 py-2 border-b border-blue-200">
                    <p className="text-sm font-medium text-gray-900">⏳ AI 正在生成回答...</p>
                  </div>
                  <div className="p-3">
                    <div className="text-sm text-gray-800 markdown-content conversation-answer">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingAnswer}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {mode === 'saved' && activeTab === 'discussion' && (
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={questionInput}
              onChange={e => setQuestionInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !askingQuestion && handleAskQuestion()}
              placeholder="提问..."
              disabled={askingQuestion}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              onClick={handleAskQuestion}
              disabled={askingQuestion || !questionInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {askingQuestion ? '生成中...' : '提问'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
