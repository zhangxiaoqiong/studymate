import React from 'react'
import DocumentUpload from './components/DocumentUpload'
import DocumentViewer from './components/DocumentViewer'
import Sidebar from './components/Sidebar'
import DocumentHistory from './components/DocumentHistory'
import SavedExplanationsList from './components/SavedExplanationsList'
import { AppProvider } from './context/AppContext'
import './index.css'

/**
 * 应用主组件
 * 使用 AppProvider 提供全局状态管理
 */
function AppContent() {
  return (
    <div className="app-container">
      <DocumentUpload />
      <div className="main-content">
        <DocumentHistory />
        <DocumentViewer />
        <Sidebar />
        <SavedExplanationsList />
      </div>
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
