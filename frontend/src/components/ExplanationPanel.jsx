import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { explainKeywordStream, askFollowupQuestionStream } from '../services/api'
import { useApp } from '../context/AppContext'

/**
 * ExplanationPanel Component
 * 从右侧滑出的详细解释页面，包含完整的markdown展示和交互功能
 */
const ExplanationPanel = ({ width = 600 }) => {
  const { state, setSelectedKeyword, setExplanation, setLoadingExplanation } = useApp()
  const { selectedKeyword, explanation, loadingExplanation, documentData, savedExplanations = {} } = state

  const [askingQuestion, setAskingQuestion] = useState(false)
  const [questionInput, setQuestionInput] = useState('')
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')
  const [savingExplanation, setSavingExplanation] = useState(false)

  const isSaved = selectedKeyword && savedExplanations[selectedKeyword]
  const currentExplanation = isSaved ? savedExplanations[selectedKeyword]?.explanation : explanation

  // 当选中关键词时，获取其解释
  useEffect(() => {
    if (!selectedKeyword) return
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
  }, [selectedKeyword, isSaved])

  const handleSaveExplanation = async () => {
    if (!selectedKeyword || !currentExplanation) return
    setSavingExplanation(true)
    try {
      // TODO: 实现保存解释到 savedExplanations
      console.log('Saving explanation for:', selectedKeyword)
      alert('✅ 解释已保存！')
    } catch (error) {
      alert('保存失败')
    } finally {
      setSavingExplanation(false)
    }
  }

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

      {/* Tab Navigation - Show only when saved */}
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

      {/* Main Content */}
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

            {currentExplanation && (
              <div className="prose prose-lg max-w-none">
                <div className="markdown-content text-gray-800 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4 text-gray-800 leading-relaxed" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                      em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code className="bg-gray-100 text-red-600 px-2 py-0.5 rounded text-sm" {...props} />
                        ) : (
                          <code className="block bg-gray-100 p-4 rounded mb-4 overflow-x-auto text-sm" {...props} />
                        ),
                      pre: ({ node, ...props }) => <pre className="bg-gray-100 p-4 rounded mb-4 overflow-x-auto" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-gray-800" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-gray-800" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-2 ml-4" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700" {...props} />
                      ),
                    }}
                  >
                    {currentExplanation}
                  </ReactMarkdown>
                </div>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
          {streamingAnswer && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-medium">AI 回答：</p>
              <div className="prose prose-sm max-w-none text-sm text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingAnswer}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExplanationPanel
