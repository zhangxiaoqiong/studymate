import React from 'react'

const DocumentViewer = ({
  text,
  title,
  spans,
  onKeywordClick,
  isEditing,
  editingTitle,
  editingText,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTitleChange,
  onTextChange,
  showReanalysisDialog,
  onReanalysisChoice,
  isReanalyzing,
}) => {
  const renderHighlightedText = () => {
    if (!spans || spans.length === 0) {
      return <span>{text}</span>
    }

    let lastIndex = 0
    const elements = []

    // 确保spans按start位置排序
    const sortedSpans = [...spans].sort((a, b) => a.start - b.start)

    sortedSpans.forEach((span, i) => {
      // 普通文本
      if (lastIndex < span.start) {
        elements.push(
          <span key={`text-${i}`}>
            {text.substring(lastIndex, span.start)}
          </span>
        )
      }

      // 高亮词
      elements.push(
        <span
          key={`keyword-${i}`}
          className="highlight"
          onClick={() => onKeywordClick(span.keyword)}
        >
          {text.substring(span.start, span.end)}
        </span>
      )

      lastIndex = span.end
    })

    // 剩余文本
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      )
    }

    return elements
  }

  // 编辑模式
  if (isEditing) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            {/* 标题编辑框 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 文档标题
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            {/* 文本编辑框 */}
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

        {/* 底部操作栏 */}
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

        {/* 关键词重新分析对话框 */}
        {showReanalysisDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
              {isReanalyzing ? (
                // 加载状态
                <div className="text-center py-8">
                  <div className="inline-block h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 font-medium">正在重新分析文本...</p>
                  <p className="text-gray-500 text-sm mt-2">提取关键词中，请稍候</p>
                </div>
              ) : (
                // 选择状态
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    📝 文本已改变
                  </h3>
                  <p className="text-gray-600 mb-6">
                    检测到您修改了文本内容。是否要重新分析文本以更新关键词？
                  </p>
                  <div className="space-y-3 text-sm text-gray-700 mb-6">
                    <p>
                      <strong>• 重新分析：</strong> AI 会从新文本中提取关键词。保留现有关键词的已保存解释，删除的关键词的解释会被移除
                    </p>
                    <p>
                      <strong>• 保留原有：</strong> 保留所有现有的关键词和已保存的解释，不进行任何更改
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onReanalysisChoice(false)}
                      disabled={isReanalyzing}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-300 text-gray-800 disabled:text-gray-600 rounded-lg font-medium transition-colors"
                    >
                      保留原有
                    </button>
                    <button
                      onClick={() => onReanalysisChoice(true)}
                      disabled={isReanalyzing}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                      重新分析
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 查看模式
  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white">
      {/* 顶部导航和编辑按钮 */}
      <div className="px-8 py-4 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          📖 {title || '文档探索器'}
        </h1>
        <button
          onClick={onStartEdit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          ✎ 编辑
        </button>
      </div>

      {/* 统计信息 */}
      <div className="px-8 py-3 bg-gray-50 border-b border-gray-200 flex gap-6 text-sm text-gray-600">
        <div>
          <span className="font-semibold text-gray-900">{text.length}</span> 字符
        </div>
        <div>
          <span className="font-semibold text-gray-900">{text.split('\n').length}</span> 段落
        </div>
        <div>
          <span className="font-semibold text-gray-900">{spans?.length || 0}</span> 关键词
        </div>
      </div>

      {/* 文档内容 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl prose prose-lg">
          <div className="text-base leading-8 text-gray-800 whitespace-pre-wrap break-words">
            {renderHighlightedText()}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-8 py-3 bg-amber-50 border-t border-amber-200 text-sm text-amber-700 flex items-center gap-2">
        <span>💡</span>
        <span>点击任何 <span className="highlight">高亮的关键词</span> 查看详细解释</span>
      </div>
    </div>
  )
}

export default DocumentViewer
