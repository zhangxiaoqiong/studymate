/**
 * 状态管理重构指南
 *
 * 这个文件展示如何将现有的 useState 组件迁移到 Context 管理
 */

// 旧的方式（直接使用 useState）
const OldComponent = () => {
  const [selectedKeyword, setSelectedKeyword] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  const handleKeywordClick = async (keyword) => {
    setSelectedKeyword(keyword)
    setLoadingExplanation(true)
    try {
      const result = await explainKeyword(keyword)
      setExplanation(result)
    } finally {
      setLoadingExplanation(false)
    }
  }

  return (
    <div>
      {/* ... JSX ... */}
    </div>
  )
}

// ============================================

// 新的方式（使用 Context）
import { useApp } from '../context/AppContext'
import { explainKeyword } from '../services/api'

const NewComponent = () => {
  const {
    state: { selectedKeyword, explanation, loadingExplanation },
    setSelectedKeyword,
    setExplanation,
    setLoadingExplanation,
  } = useApp()

  const handleKeywordClick = async (keyword) => {
    setSelectedKeyword(keyword)
    setLoadingExplanation(true)
    try {
      const result = await explainKeyword(keyword)
      setExplanation(result)
    } finally {
      setLoadingExplanation(false)
    }
  }

  return (
    <div>
      {/* ... JSX ... */}
    </div>
  )
}

// ============================================

/**
 * 迁移步骤：
 *
 * 1. 导入 useApp Hook
 *    import { useApp } from '../context/AppContext'
 *
 * 2. 在组件中获取状态和操作
 *    const { state: { ... }, ... } = useApp()
 *
 * 3. 使用状态和操作替换 useState
 *    // 旧: setSelectedKeyword(keyword)
 *    // 新: setSelectedKeyword(keyword)  (从 useApp 获取)
 *
 * 4. 删除原有的 useState 声明
 *
 * 5. 测试确保功能正常
 *
 * ============================================
 *
 * 支持的操作方法：
 *
 * 文档操作：
 * - setDocumentData(data)
 * - setDocuments(docs)
 * - setActiveDocId(id)
 * - addDocument(doc)
 * - updateDocument(doc)
 * - deleteDocument(id)
 *
 * 选择和解释：
 * - setSelectedKeyword(keyword)
 * - setExplanation(explanation)
 *
 * 编辑模式：
 * - setEditing(isEditing)
 * - setEditingTitle(title)
 * - setEditingText(text)
 *
 * 加载状态：
 * - setLoadingExplanation(loading)
 * - setReanalyzing(reanalyzing)
 * - setShowReanalysisDialog(show)
 *
 * UI 状态：
 * - setShowLeftSidebar(show)
 * - setSidebarWidth(width)
 *
 * 错误处理：
 * - setError(error)
 * - clearError()
 *
 * 批量操作：
 * - resetAll()  // 重置所有状态
 */
