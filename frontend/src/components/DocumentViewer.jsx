import React from 'react'
import { useApp } from '../context/AppContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const DocumentViewer = () => {
  const { state, setSelectedKeyword, setEditing, setEditingTitle, setEditingText } = useApp()
  const {
    documentData,
    spans = [],
    isEditing,
    editingTitle,
    editingText,
    showReanalysisDialog,
    isReanalyzing,
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

  if (isEditing) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 文档标题 <span className="text-xs text-gray-400 font-normal">（选填）</span>
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="输入文档标题，或留空使用默认标题"
                className="w-full px-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📄 文本内容
              </label>
              <textarea
                value={editingText}
                onChange={(e) => onTextChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all font-mono text-sm leading-relaxed"
                rows={20}
              />
              <p className="text-xs text-gray-500 mt-2">
                {editingText.length} / 10000 字符
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4 flex gap-3 justify-end">
          <button
            onClick={onCancelEdit}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
          >
            ✕ 取消
          </button>
          <button
            onClick={() => onSaveEdit(editingTitle, editingText)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            ✓ 保存
          </button>
        </div>

        {showReanalysisDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
              {isReanalyzing ? (
                <div className="text-center py-8">
                  <div className="inline-block h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 font-medium">正在重新分析文本...</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📝 文本已改变</h3>
                  <p className="text-gray-600 mb-6">检测到您修改了文本内容。是否要重新分析文本以更新关键词？</p>
                  <div className="flex gap-3">
                    <button onClick={() => onReanalysisChoice(false)} disabled={isReanalyzing} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">保留原有</button>
                    <button onClick={() => onReanalysisChoice(true)} disabled={isReanalyzing} className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">重新分析</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white">
      {/* 紧凑的头部 */}
      <div className="px-6 py-3 bg-white shadow-xs border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate py-3">📖 {title || 'StudyMate'}</h1>
            <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
              <span><span className="font-semibold text-gray-700">{text.length}</span> 字符</span>
              <span><span className="font-semibold text-gray-700">{text.split('\n').length}</span> 段落</span>
              <span><span className="font-semibold text-gray-700">{spans?.length || 0}</span> 关键词</span>
            </div>
          </div>
          <button onClick={onStartEdit} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex-shrink-0">✎ 编辑</button>
        </div>
      </div>

      {/* 内容区域 - 更紧凑 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-white to-gray-50">
        <div className="px-5 py-4 max-w-5xl">
          <div className="markdown-content">
            <div className="text-sm leading-7 text-gray-800 whitespace-pre-wrap break-words">
              {renderHighlightedText()}
            </div>
          </div>
        </div>
      </div>

      {/* 底部提示 - 更紧凑 */}
      <div className="px-6 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 flex items-center gap-2">
        <span>💡</span>
        <span>点击 <span className="highlight">高亮词</span> 查看详解</span>
      </div>
    </div>
  )
}

export default DocumentViewer
