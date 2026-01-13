import React from 'react'
import { useApp } from '../context/AppContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DocumentUpload from './DocumentUpload'

const DocumentViewer = ({ onEditClick }) => {
  const { state, setSelectedKeyword } = useApp()
  const {
    documentData,
    spans = [],
  } = state

  const { text = '', title = '' } = documentData || {}
  const renderHighlightedText = () => {
    if (!spans || spans.length === 0) {
      return <span>{text}</span>
    }

    let lastIndex = 0
    const elements = []
    const sortedSpans = [...spans].sort((a, b) => a.start - b.start)

    sortedSpans.forEach((span, i) => {
      if (lastIndex < span.start) {
        elements.push(
          <span key={`text-${i}`}>
            {text.substring(lastIndex, span.start)}
          </span>
        )
      }

      elements.push(
        <span
          key={`keyword-${i}`}
          className="highlight"
          onClick={() => setSelectedKeyword(span.keyword)}
        >
          {text.substring(span.start, span.end)}
        </span>
      )

      lastIndex = span.end
    })

    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      )
    }

    return elements
  }

  if (!documentData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-lg">
          <svg className="w-24 h-24 text-blue-200 mb-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">开始学习</h2>
          <p className="text-gray-600 text-center mb-8">上传或粘贴文本，AI 将自动提取关键知识点供你深入探索</p>
          <DocumentUpload />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white">
      {/* Document Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">📖 {title || 'Untitled'}</h1>
            <div className="flex gap-6 text-sm text-gray-600 mt-2">
              <span>📊 <span className="font-semibold">{text.length}</span> 字符</span>
              <span>📝 <span className="font-semibold">{text.split('\n').length}</span> 段落</span>
              <span>🔑 <span className="font-semibold text-blue-600">{spans?.length || 0}</span> 关键词</span>
            </div>
          </div>
          <button
            onClick={onEditClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex-shrink-0"
          >
            ✎ 编辑文档
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="px-8 py-6 max-w-4xl mx-auto">
          <div className="markdown-content text-gray-800 leading-relaxed">
            <div className="prose prose-lg">
              {renderHighlightedText()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-700 flex items-center gap-2">
        <span>💡</span>
        <span>点击 <span className="highlight text-sm">高亮关键词</span> 即可查看详细解释</span>
      </div>
    </div>
  )
}

export default DocumentViewer
