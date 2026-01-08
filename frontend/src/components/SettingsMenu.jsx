import React, { useState } from 'react'
import LLMConfigManager from './LLMConfigManager'

const SettingsMenu = ({ onClose, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'llm', label: '🤖 大模型配置', icon: '⚙️' },
    // 后续可以添加更多设置项
    // { id: 'appearance', label: '🎨 外观设置', icon: '🎨' },
    // { id: 'general', label: '⚙️ 通用设置', icon: '⚙️' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex relative z-[60]">
        {/* 左侧菜单 */}
        <div className="w-48 bg-gray-100 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">⚙️ 设置</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left px-4 py-3 border-l-4 transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部关闭按钮 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {tabs.find((t) => t.id === activeTab)?.label || '设置'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'llm' && <LLMConfigManager onClose={onClose} isInMenu={true} />}
            {activeTab === null && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>请选择一个设置项</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsMenu
