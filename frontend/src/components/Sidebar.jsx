import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { askFollowupQuestionStream } from '../services/api'
import { useApp } from '../context/AppContext'

const Sidebar = ({ width = 320 }) => {
  const { state, setSelectedKeyword } = useApp()
  const { selectedKeyword, explanation, loadingExplanation, savedExplanations = {} } = state

  const [askingQuestion, setAskingQuestion] = useState(false)
  const [questionInput, setQuestionInput] = useState('')
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [regeneratingAnswer, setRegeneratingAnswer] = useState('')

  const isSaved = selectedKeyword && savedExplanations[selectedKeyword]
  const currentExplanation = isSaved ? savedExplanations[selectedKeyword]?.explanation : explanation

  const handleAskQuestion = async () => {
    if (!questionInput.trim()) return
    setAskingQuestion(true)
    setStreamingAnswer('')
    try {
      const result = await askFollowupQuestionStream(
        selectedKeyword,
        savedExplanations[selectedKeyword]?.explanation || explanation,
        questionInput,
        (chunk) => setStreamingAnswer(prev => prev + chunk)
      )
      setQuestionInput('')
      setStreamingAnswer('')
    } catch (e) {
      alert('提问失败')
    } finally {
      setAskingQuestion(false)
    }
  }

  if (!selectedKeyword) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
        <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-center">点击关键词查看详解</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-sm font-bold text-gray-900 truncate">{selectedKeyword}</h3>
        <p className="text-xs text-gray-500 mt-1">{isSaved ? '已保存' : '详细解释'}</p>
      </div>

      {/* Tab Navigation */}
      {isSaved && (
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex-1 py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'explanation'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            解释
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'discussion'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            讨论 {savedExplanations[selectedKeyword]?.conversations?.length > 0 && <span className="ml-1 text-xs">{savedExplanations[selectedKeyword].conversations.length}</span>}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {!loadingExplanation && !currentExplanation && (
          <div className="text-center py-4 text-gray-400 text-sm">
            <p>暂无解释</p>
          </div>
        )}

        {currentExplanation && activeTab === 'explanation' && (
          <div className="markdown-content text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentExplanation}</ReactMarkdown>
          </div>
        )}

        {isSaved && activeTab === 'discussion' && (
          <div className="space-y-2">
            {savedExplanations[selectedKeyword]?.conversations?.length > 0 ? (
              savedExplanations[selectedKeyword].conversations.map((c, i) => (
                <div key={i} className="bg-gray-50 rounded border border-gray-200 p-2 text-xs">
                  <div className="font-medium text-gray-700 mb-1">Q: {c.question}</div>
                  <div className="text-gray-600 pl-2 border-l border-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.answer}</ReactMarkdown>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-xs py-4">暂无讨论</p>
            )}
          </div>
        )}

        {loadingExplanation && <p className="text-xs text-gray-500 animate-pulse">⏳ 生成中...</p>}
      </div>

      {/* Input Area - Only for saved mode discussion tab */}
      {isSaved && activeTab === 'discussion' && (
        <div className="border-t border-gray-200 bg-white p-3 space-y-2">
          <input
            type="text"
            value={questionInput}
            onChange={e => setQuestionInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !askingQuestion && handleAskQuestion()}
            placeholder="提问..."
            disabled={askingQuestion}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleAskQuestion}
            disabled={askingQuestion || !questionInput.trim()}
            className="w-full px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {askingQuestion ? '生成中...' : '提问'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Sidebar
