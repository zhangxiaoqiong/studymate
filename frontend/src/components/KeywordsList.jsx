import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

/**
 * KeywordsList Component
 * 在右侧sidebar显示关键词列表，已保存的项目有标记
 */
const KeywordsList = () => {
  const { state, setSelectedKeyword } = useApp()
  const { keywords = [], savedExplanations = {} } = state
  const [hoveredId, setHoveredId] = useState(null)

  const savedCount = Object.keys(savedExplanations).length

  if (!keywords || keywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-gray-500 h-full">
        <span className="text-4xl mb-2">🔑</span>
        <p className="text-sm text-center">开始探索文本以提取关键词</p>
      </div>
    )
  }

  const handleDelete = (e, keywordId, keyword) => {
    e.stopPropagation()
    console.log('Delete keyword:', keyword)
  }

  // 将关键词按是否保存排序（保存的在前）
  const sortedKeywords = [...keywords].sort((a, b) => {
    const aIsSaved = !!savedExplanations[a.keyword]
    const bIsSaved = !!savedExplanations[b.keyword]
    return bIsSaved - aIsSaved
  })

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-lg font-bold text-gray-900">🔑 关键词</h2>
        <p className="text-xs text-gray-600 mt-1">
          {keywords.length} 个关键词 {savedCount > 0 && `· ${savedCount} 已保存`}
        </p>
      </div>

      {/* Keywords List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {sortedKeywords.map((kw, index) => {
            const isSaved = savedExplanations[kw.keyword]
            return (
              <button
                key={kw.id || index}
                onMouseEnter={() => setHoveredId(kw.id || index)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedKeyword(kw.keyword)}
                className={`w-full text-left px-4 py-3 border rounded-lg transition-all group relative ${
                  isSaved
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-sm font-semibold flex-shrink-0 mt-0.5 ${isSaved ? 'text-blue-600' : 'text-blue-600'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate group-hover:${isSaved ? 'text-blue-700' : 'text-blue-600'}`}>
                        {kw.keyword}
                      </p>
                      {isSaved && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                          ✓ 已保存
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">点击查看详细解释</p>
                  </div>

                  {/* Delete Button - Show on hover */}
                  {hoveredId === (kw.id || index) && (
                    <button
                      onClick={(e) => handleDelete(e, kw.id, kw.keyword)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {hoveredId !== (kw.id || index) && (
                    <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">→</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-gray-200 bg-blue-50 text-xs text-blue-700">
        <p>💡 点击关键词查看详细解释，可保存解释</p>
      </div>
    </div>
  )
}

export default KeywordsList



