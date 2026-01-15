import React, { useState } from 'react'
import DocumentCenter from './components/DocumentCenter'
import Sidebar from './components/Sidebar'
import DocumentHistory from './components/DocumentHistory'
import ModelSwitcher from './components/ModelSwitcher'
import MarkdownEditor from './components/MarkdownEditor'
import PromptManager from './components/PromptManager'
import { AppProvider, useApp } from './context/AppContext'
import './index.css'

/**
 * 应用主组件
 * 三栏布局：左侧栏（历史） + 中间（文档编辑/预览） + 右侧栏（解释）
 */
function AppContent() {
  const { state, updateDocument, setEditing } = useApp()
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [resizing, setResizing] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showPromptManager, setShowPromptManager] = useState(false)

  const handleResizeStart = (e) => {
    setResizing(true)
  }

  const handleResizeMove = (e) => {
    if (!resizing) return
    const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX))
    setSidebarWidth(newWidth)
  }

  const handleResizeEnd = () => {
    setResizing(false)
  }

  const handleSaveEdit = (newTitle, newText) => {
    if (state.documentData) {
      updateDocument({
        ...state.documentData,
        title: newTitle,
        text: newText,
      })
    }
    setShowEditor(false)
    setEditing(false)
  }

  React.useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [resizing])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📚 StudyMate</h1>
            <p className="text-blue-100 text-sm mt-1">AI 驱动的智能学习助手</p>
          </div>
          <div className="flex items-center gap-4">
            <ModelSwitcher />
            <button
              onClick={() => setShowPromptManager(true)}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              📋 Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Document History */}
        <div className="bg-white border-r border-gray-200 flex flex-col">
          <DocumentHistory />
        </div>

        {/* Middle - Document Center */}
        <div className="flex-1 overflow-hidden">
          <DocumentCenter onEditClick={() => setShowEditor(true)} />
        </div>

        {/* Right Panel - Keywords List (always visible) */}
        {state.keywords && state.keywords.length > 0 && (
          <>
            <div
              className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors"
              onMouseDown={handleResizeStart}
            />
            <div
              className="bg-white border-l border-gray-200 overflow-y-auto flex flex-col"
              style={{ width: `${sidebarWidth}px` }}
            >
              <KeywordsList />
            </div>
          </>
        )}
      </div>

      {/* Sidebar Overlay - Slides in from right */}
      {state.selectedKeyword && (
        <div className="sidebar-enter fixed top-0 right-0 h-screen z-50 border-l border-gray-200" style={{ width: '800px' }}>
          <Sidebar width={800} />
        </div>
      )}

      {/* Markdown Editor Modal */}
      {showEditor && (
        <MarkdownEditor
          title={state.documentData?.title || ''}
          text={state.documentData?.text || ''}
          onSave={handleSaveEdit}
          onCancel={() => {
            setShowEditor(false)
            setEditing(false)
          }}
        />
      )}

      {/* Prompt Manager Modal */}
      <PromptManager isOpen={showPromptManager} onClose={() => setShowPromptManager(false)} />
    </div>
  )
}

/**
 * 应用根组件
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
