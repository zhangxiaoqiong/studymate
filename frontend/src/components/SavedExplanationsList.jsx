import React from 'react'

const SavedExplanationsList = ({
  savedExplanations,
  selectedKeyword,
  onSelectKeyword,
  onDelete,
  width = 350,
}) => {
  const formatDate = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }

  const handleDeleteClick = (e, keyword) => {
    e.stopPropagation()
    onDelete(keyword)
  }

  return (
    <div
      className="bg-blue-50 border-l border-gray-200 flex flex-col overflow-hidden shadow-sm"
      style={{ width: `${width}px` }}
    >
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h3 className="text-base font-bold text-gray-900">
          📚 已保存解释
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {Object.keys(savedExplanations).length} 个
        </p>
      </div>

      {/* 列表内容 */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(savedExplanations).length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-xs text-gray-500">暂无已保存的解释</p>
              <p className="text-xs text-gray-400 mt-2">点击关键词生成解释后保存</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {Object.entries(savedExplanations).map(([keyword, data]) => (
              <button
                key={keyword}
                onClick={() => onSelectKeyword(keyword)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedKeyword === keyword
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {keyword}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(data.savedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, keyword)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedExplanationsList
