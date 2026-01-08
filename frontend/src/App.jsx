import React, { useState, useEffect } from 'react'
import DocumentUpload from './components/DocumentUpload'
import DocumentViewer from './components/DocumentViewer'
import Sidebar from './components/Sidebar'
import DocumentHistory from './components/DocumentHistory'
import SavedExplanationsList from './components/SavedExplanationsList'
import { extractKeywords, explainKeyword, explainKeywordStream } from './services/api'
import './index.css'

function App() {
  const [documentData, setDocumentData] = useState(null)
  const [selectedKeyword, setSelectedKeyword] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [activeDocId, setActiveDocId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingText, setEditingText] = useState('')
  const [showReanalysisDialog, setShowReanalysisDialog] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(700)

  // 从 localStorage 恢复数据和历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('documentHistory')
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setDocuments(history)
        // 注意：启动时不自动打开文档，始终显示对话页
        // 用户需要从历史列表中主动选择文档
      } catch (e) {
        console.error('Failed to restore history:', e)
      }
    }
  }, [])

  const generateDocId = () => {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  const handleDocumentUpload = async (data) => {
    setError(null)
    try {
      const result = await extractKeywords(data.text, data.title)
      const docId = generateDocId()
      const newDoc = {
        ...result,
        id: docId,
        timestamp: Date.now(),
        savedExplanations: {},
      }

      setDocumentData(newDoc)
      setActiveDocId(docId)
      setSelectedKeyword(null)
      setExplanation(null)

      // 保存到历史
      const updatedDocs = [newDoc, ...documents]
      setDocuments(updatedDocs)
      localStorage.setItem('documentHistory', JSON.stringify(updatedDocs))
      localStorage.setItem('activeDocId', docId)
    } catch (error) {
      const errorMsg = '处理文档失败，请检查API连接'
      setError(errorMsg)
      alert(errorMsg)
    }
  }

  const handleSelectDoc = (docId) => {
    const selectedDoc = documents.find((doc) => doc.id === docId)
    if (selectedDoc) {
      setDocumentData(selectedDoc)
      setActiveDocId(docId)
      setSelectedKeyword(null)
      setExplanation(null)
      localStorage.setItem('activeDocId', docId)
    }
  }

  const handleNewDoc = () => {
    setDocumentData(null)
    setActiveDocId(null)
    setSelectedKeyword(null)
    setExplanation(null)
    localStorage.removeItem('activeDocId')
  }

  const handleDeleteDoc = (docId) => {
    const updatedDocs = documents.filter((doc) => doc.id !== docId)
    setDocuments(updatedDocs)
    localStorage.setItem('documentHistory', JSON.stringify(updatedDocs))

    // 如果删除的是当前文档
    if (activeDocId === docId) {
      if (updatedDocs.length > 0) {
        handleSelectDoc(updatedDocs[0].id)
      } else {
        handleNewDoc()
      }
    }
  }

  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？')) {
      setDocumentData(null)
      setActiveDocId(null)
      setSelectedKeyword(null)
      setExplanation(null)
      setError(null)
      setDocuments([])
      localStorage.removeItem('documentHistory')
      localStorage.removeItem('activeDocId')
    }
  }

  // 更新文档数据并持久化到 localStorage
  const updateDocumentData = (updatedDoc) => {
    setDocumentData(updatedDoc)
    const updatedDocs = documents.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
    setDocuments(updatedDocs)
    localStorage.setItem('documentHistory', JSON.stringify(updatedDocs))
  }

  // 保存解释到当前文档
  const handleSaveExplanation = (keyword, explanation) => {
    if (!documentData) return
    const updatedDoc = {
      ...documentData,
      savedExplanations: {
        ...documentData.savedExplanations,
        [keyword]: {
          keyword,
          explanation,
          savedAt: Date.now(),
          conversations: [],
        },
      },
    }
    updateDocumentData(updatedDoc)
  }

  // 删除已保存的解释
  const handleDeleteExplanation = (keyword) => {
    if (!documentData) return
    if (!window.confirm(`确定要删除 "${keyword}" 的解释吗？`)) return
    const { [keyword]: _, ...restExplanations } = documentData.savedExplanations
    const updatedDoc = {
      ...documentData,
      savedExplanations: restExplanations,
    }
    updateDocumentData(updatedDoc)
  }

  // 更新已保存的解释（包括添加对话）
  const handleUpdateSavedExplanation = (keyword, updatedExplanation) => {
    if (!documentData) return
    const updatedDoc = {
      ...documentData,
      savedExplanations: {
        ...documentData.savedExplanations,
        [keyword]: updatedExplanation,
      },
    }
    updateDocumentData(updatedDoc)
  }

  // 刷新解释（重新调用 API） - 流式版本
  const handleRefreshExplanation = async () => {
    const keyword = selectedKeyword
    setLoadingExplanation(true)
    setExplanation('')  // 清空旧解释
    try {
      const result = await explainKeywordStream(keyword, '', (chunk) => {
        setExplanation(prev => prev + chunk)
      })
    } catch (error) {
      const errorMsg = '生成解释失败，请重试'
      setExplanation(errorMsg)
    } finally {
      setLoadingExplanation(false)
    }
  }

  // 进入编辑模式
  const handleStartEdit = () => {
    setEditingTitle(documentData.title)
    setEditingText(documentData.text)
    setIsEditing(true)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingTitle('')
    setEditingText('')
    setShowReanalysisDialog(false)
  }

  // 保存编辑
  const handleSaveEdit = async (newTitle, newText) => {
    const textChanged = newText !== documentData.text

    // 更新文档
    const updatedDoc = {
      ...documentData,
      title: newTitle,
      text: newText,
    }

    if (textChanged) {
      // 文本改变了，需要重新提取关键词 - 弹出对话框询问用户
      setShowReanalysisDialog(true)
      // 保存临时编辑状态，等待用户选择
      setEditingTitle(newTitle)
      setEditingText(newText)
    } else {
      // 只改变了标题，直接保存
      updateDocumentData(updatedDoc)
      setIsEditing(false)
    }
  }

  // 处理关键词重新分析的选择
  const handleReanalysisChoice = async (shouldReanalyze) => {
    const updatedDoc = {
      ...documentData,
      title: editingTitle,
      text: editingText,
    }

    if (shouldReanalyze) {
      // 重新分析文本
      setIsReanalyzing(true)
      try {
        const result = await extractKeywords(editingText, editingTitle)
        const newKeywords = result.keywords
        const newSpans = result.spans

        // 智能合并：对比新旧关键词
        const oldKeywordSet = new Set(documentData.keywords?.map(k => k.keyword) || [])
        const newKeywordSet = new Set(newKeywords.map(k => k.keyword))

        // 只保留仍然存在的关键词的已保存解释
        const mergedSavedExplanations = {}
        Object.entries(documentData.savedExplanations || {}).forEach(([keyword, explanation]) => {
          if (newKeywordSet.has(keyword)) {
            // 这个关键词仍然存在，保留其解释
            mergedSavedExplanations[keyword] = explanation
          }
          // 已删除的关键词的解释会被过滤掉
        })

        updatedDoc.keywords = newKeywords
        updatedDoc.spans = newSpans
        updatedDoc.savedExplanations = mergedSavedExplanations
      } catch (error) {
        setIsReanalyzing(false)
        alert('重新分析失败，请稍后重试')
        setShowReanalysisDialog(false)
        return
      }
    }
    // 如果不重新分析，保留原有的关键词和已保存的解释

    updateDocumentData(updatedDoc)
    setIsEditing(false)
    setShowReanalysisDialog(false)
    setIsReanalyzing(false)
    setEditingTitle('')
    setEditingText('')
  }

  const handleKeywordClick = async (keyword) => {
    setSelectedKeyword(keyword)

    // 检查是否已有保存的解释
    if (documentData?.savedExplanations?.[keyword]) {
      setExplanation(documentData.savedExplanations[keyword].explanation)
      setLoadingExplanation(false)
      return
    }

    // 否则调用 API 生成新的解释（使用流式）
    setExplanation('')
    setLoadingExplanation(true)

    try {
      await explainKeywordStream(keyword, '', (chunk) => {
        setExplanation(prev => prev + chunk)
      })
    } catch (error) {
      const errorMsg = '生成解释失败，请重试'
      setExplanation(errorMsg)
    } finally {
      setLoadingExplanation(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* 左侧历史栏（可隐藏） */}
      {showLeftSidebar && (
        <div className="relative">
          <DocumentHistory
            documents={documents}
            activeDocId={activeDocId}
            onSelectDoc={handleSelectDoc}
            onNewDoc={handleNewDoc}
            onDeleteDoc={handleDeleteDoc}
          />
          {/* 隐藏左侧栏按钮 */}
          <button
            onClick={() => setShowLeftSidebar(false)}
            className="absolute top-4 right-0 transform translate-x-1/2 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg transition-colors"
            title="隐藏目录"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* 显示左侧栏按钮（当左侧栏隐藏时） */}
        {!showLeftSidebar && (
          <button
            onClick={() => setShowLeftSidebar(true)}
            className="absolute left-0 top-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg transition-colors z-40"
            title="显示目录"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {documentData ? (
          // 正在查看文档
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 文档查看器 */}
              <DocumentViewer
                text={documentData.text}
                title={documentData.title}
                spans={documentData.spans}
                onKeywordClick={handleKeywordClick}
                isEditing={isEditing}
                editingTitle={editingTitle}
                editingText={editingText}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onTitleChange={setEditingTitle}
                onTextChange={setEditingText}
                showReanalysisDialog={showReanalysisDialog}
                onReanalysisChoice={handleReanalysisChoice}
                isReanalyzing={isReanalyzing}
              />
            </div>

            {/* 右侧已保存列表 + 解释栏 */}
            {Object.keys(documentData?.savedExplanations || {}).length > 0 && (
              <SavedExplanationsList
                savedExplanations={documentData?.savedExplanations || {}}
                selectedKeyword={selectedKeyword}
                onSelectKeyword={setSelectedKeyword}
                onDelete={handleDeleteExplanation}
                width={256}
              />
            )}

            {/* 右侧解释栏 */}
            {selectedKeyword && (
              <Sidebar
                keyword={selectedKeyword}
                explanation={explanation}
                loading={loadingExplanation}
                onClose={() => setSelectedKeyword(null)}
                isSaved={!!documentData?.savedExplanations?.[selectedKeyword]}
                savedExplanations={documentData?.savedExplanations || {}}
                onSave={handleSaveExplanation}
                onDelete={handleDeleteExplanation}
                onRefresh={handleRefreshExplanation}
                onUpdateSavedExplanation={handleUpdateSavedExplanation}
                width={sidebarWidth}
                onResizeStart={(startX) => {
                  const startWidth = sidebarWidth

                  const handleMouseMove = (moveEvent) => {
                    const diff = moveEvent.clientX - startX
                    const newWidth = Math.max(400, startWidth - diff)
                    setSidebarWidth(newWidth)
                  }

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove)
                    document.removeEventListener('mouseup', handleMouseUp)
                  }

                  document.addEventListener('mousemove', handleMouseMove)
                  document.addEventListener('mouseup', handleMouseUp)
                }}
              />
            )}
          </div>
        ) : (
          // 对话页面：没有打开文档时显示上传界面
          <div className="flex items-center justify-center h-full py-12 px-4">
            <DocumentUpload onUpload={handleDocumentUpload} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
