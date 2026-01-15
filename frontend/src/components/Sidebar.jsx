import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { explainKeywordStream, askFollowupQuestionStream } from '../services/api'
import { useApp } from '../context/AppContext'

const Sidebar = ({ width = 800 }) => {
  const { state, setSelectedKeyword, setExplanation, setLoadingExplanation, saveExplanation, addConversation } = useApp()
  const { selectedKeyword, explanation, loadingExplanation, documentData, savedExplanations = {} } = state

  const [askingQuestion, setAskingQuestion] = useState(false)
  const [questionInput, setQuestionInput] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')
  const [savingExplanation, setSavingExplanation] = useState(false)

  // 自定义代码块渲染
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''

    if (inline) {
      return <code className="bg-gray-200 px-2 py-1 rounded text-sm text-gray-900 font-mono" {...props}>{children}</code>
    }

    // 获取代码内容，清理所有格式残留
    let code = String(children)
      .replace(/\n$/, '') // 移除末尾换行
      .replace(/^```[\w]*\n?/, '') // 移除开头的 ```language
      .replace(/\n?```$/, '') // 移除末尾的 ```
      .trim()

    // 代码块渲染
    return (
      <div className="rounded-lg my-2 overflow-hidden border border-gray-700">
        {language && (
          <div className="bg-gray-800 text-gray-400 px-3 py-1 text-xs font-mono font-semibold">
            {language}
          </div>
        )}
        <pre className="bg-gray-900 text-green-400 p-3 overflow-x-auto">
          <code className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">{code}</code>
        </pre>
      </div>
    )
  }

  const isSaved = selectedKeyword && savedExplanations[selectedKeyword]
  const currentExplanation = isSaved ? savedExplanations[selectedKeyword]?.explanation : explanation

  // 当选中关键词时，获取其解释
  useEffect(() => {
    if (!selectedKeyword) return

    // 如果已保存，不需要重新获取
    if (isSaved) return

    const fetchExplanation = async () => {
      setLoadingExplanation(true)
      setExplanation('')
      try {
        let fullExplanation = ''
        await explainKeywordStream(
          selectedKeyword,
          documentData?.text || '',
          (chunk) => {
            fullExplanation += chunk
            setExplanation(fullExplanation)
          }
        )
      } catch (error) {
        console.error('Failed to fetch explanation:', error)
        setExplanation('获取解释失败，请重试')
      } finally {
        setLoadingExplanation(false)
      }
    }

    fetchExplanation()
  }, [selectedKeyword])

  const handleAskQuestion = async () => {
    if (!questionInput.trim()) return
    setAskingQuestion(true)
    const userQuestion = questionInput
    try {
      let fullAnswer = ''
      await askFollowupQuestionStream(
        selectedKeyword,
        savedExplanations[selectedKeyword]?.explanation || explanation,
        userQuestion,
        (chunk) => {
          fullAnswer += chunk
        }
      )
      // 保存对话记录到已保存的解释中
      addConversation(selectedKeyword, userQuestion, fullAnswer)
      setQuestionInput('')
      // 自动切换到讨论标签页显示新的对话
      setActiveTab('discussion')
    } catch (e) {
      alert('提问失败')
    } finally {
      setAskingQuestion(false)
    }
  }

  const handleSaveExplanation = async () => {
    if (!selectedKeyword || !currentExplanation) return
    setSavingExplanation(true)
    try {
      saveExplanation(selectedKeyword, currentExplanation)
      alert('✅ 解释已保存！')
    } catch (error) {
      alert('保存失败')
    } finally {
      setSavingExplanation(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white shadow-2xl" style={{ width: `${width}px`, minWidth: `${width}px` }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">📖 {selectedKeyword}</h2>
          <p className="text-xs text-gray-600 mt-1">{isSaved ? '✓ 已保存' : '详细解释'}</p>
        </div>
        <button
          onClick={() => setSelectedKeyword(null)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors ml-3"
          title="关闭"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      {isSaved && (
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'explanation'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            📝 解释
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'discussion'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            💬 讨论 {savedExplanations[selectedKeyword]?.conversations?.length > 0 && `(${savedExplanations[selectedKeyword].conversations.length})`}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Explanation Tab */}
        {activeTab === 'explanation' && (
          <>
            {loadingExplanation && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-sm text-gray-600">⏳ 生成解释中，请稍候...</p>
                </div>
              </div>
            )}

            {!loadingExplanation && !currentExplanation && (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <p className="text-sm">暂无解释</p>
              </div>
            )}

            {!loadingExplanation && currentExplanation && (
              <div className="markdown-content text-gray-800 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                  {currentExplanation}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}

        {/* Discussion Tab */}
        {activeTab === 'discussion' && isSaved && (
          <div className="space-y-4">
            {savedExplanations[selectedKeyword]?.conversations?.length > 0 ? (
              savedExplanations[selectedKeyword].conversations.map((c, i) => (
                <div key={i} className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="font-semibold text-blue-900 mb-2">❓ {c.question}</div>
                  <div className="text-gray-700 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                      {c.answer}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">暂无讨论，开始提问吧</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - Save explanation (if not saved) */}
      {!isSaved && currentExplanation && !loadingExplanation && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
          <button
            onClick={handleSaveExplanation}
            disabled={savingExplanation}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:bg-gray-400 transition-colors"
          >
            {savingExplanation ? '💾 保存中...' : '💾 保存解释'}
          </button>
        </div>
      )}

      {/* Input Area - For asking questions */}
      {currentExplanation && !loadingExplanation && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 space-y-3 flex-shrink-0">
          <input
            type="text"
            value={questionInput}
            onChange={e => setQuestionInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !askingQuestion && handleAskQuestion()}
            placeholder={isSaved ? '继续提问...' : '有疑问？点保存后可提问...'}
            disabled={askingQuestion || (!isSaved && !currentExplanation)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleAskQuestion}
            disabled={askingQuestion || !questionInput.trim() || (!isSaved && !currentExplanation)}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {askingQuestion ? '⏳ 生成中...' : '❓ 提问'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Sidebar
