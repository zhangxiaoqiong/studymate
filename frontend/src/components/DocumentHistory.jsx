import React, { useState } from 'react'
import ModelSettings from './ModelSettings'
import SettingsMenu from './SettingsMenu'

const DocumentHistory = ({ documents, activeDocId, onSelectDoc, onNewDoc, onDeleteDoc }) => {
  const [expanded, setExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState(null)

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  const getDocTitle = (doc) => {
    if (doc.title && doc.title !== 'Untitled') {
      return doc.title
    }
    // 从文本中提取前30个字符作为标题
    return doc.text.substring(0, 30).replace(/\n/g, ' ') + (doc.text.length > 30 ? '...' : '')
  }

  // 过滤文档
  const filteredDocuments = documents.filter(doc => {
    const title = getDocTitle(doc).toLowerCase()
    const query = searchQuery.toLowerCase()
    return title.includes(query)
  })

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col shadow-lg border-r border-gray-800">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        <button
          onClick={onNewDoc}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <span>➕</span>
          <span>新对话</span>
        </button>

        {/* 搜索框 */}
        {documents.length > 0 && (
          <div className="relative">
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* 历史列表 */}
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>暂无历史</p>
            <p className="text-xs mt-2">开始探索文档会自动保存</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>未找到匹配的文档</p>
            <p className="text-xs mt-2 text-gray-600">试试其他搜索词</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`group relative rounded-lg transition-all ${
                  activeDocId === doc.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <button
                  onClick={() => onSelectDoc(doc.id)}
                  className="w-full text-left px-3 py-2 flex-1 flex flex-col gap-1 truncate"
                >
                  <div className="text-sm font-medium truncate text-white">
                    {getDocTitle(doc)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(doc.timestamp)}
                  </div>
                </button>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (
                      window.confirm(
                        `确定要删除"${getDocTitle(doc)}"吗？`
                      )
                    ) {
                      onDeleteDoc(doc.id)
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600 rounded text-red-400 hover:text-white"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
        {/* 设置按钮 - 靠左 */}
        <button
          onClick={() => setShowSettings(true)}
          className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          title="设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* 文档统计 - 靠右 */}
        <div>
          {documents.length > 0 && (
            <p>{filteredDocuments.length} / {documents.length} 文档</p>
          )}
        </div>
      </div>

      {/* 设置菜单 */}
      {showSettings && (
        <SettingsMenu
          onClose={() => {
            setShowSettings(false)
            setActiveSettingsTab(null)
          }}
          activeTab={activeSettingsTab}
          onTabChange={setActiveSettingsTab}
        />
      )}
    </div>
  )
}

export default DocumentHistory
