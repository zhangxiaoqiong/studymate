import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

/**
 * 应用全局状态 Context
 * 管理所有与文档、解释和UI相关的状态
 */
export const AppContext = createContext(null)

// 初始状态
const initialState = {
  // 文档相关
  documentData: null,
  documents: [],
  activeDocId: null,

  // 选中和解释相关
  selectedKeyword: null,
  explanation: null,

  // 编辑模式
  isEditing: false,
  editingTitle: '',
  editingText: '',

  // 加载和对话框状态
  loadingExplanation: false,
  isReanalyzing: false,
  showReanalysisDialog: false,

  // UI 状态
  showLeftSidebar: true,
  sidebarWidth: 700,

  // 错误状态
  error: null,
}

// Action types
export const ACTIONS = {
  // 文档操作
  SET_DOCUMENT_DATA: 'SET_DOCUMENT_DATA',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  SET_ACTIVE_DOC_ID: 'SET_ACTIVE_DOC_ID',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  DELETE_DOCUMENT: 'DELETE_DOCUMENT',

  // 选择和解释
  SET_SELECTED_KEYWORD: 'SET_SELECTED_KEYWORD',
  SET_EXPLANATION: 'SET_EXPLANATION',

  // 编辑模式
  SET_EDITING: 'SET_EDITING',
  SET_EDITING_TITLE: 'SET_EDITING_TITLE',
  SET_EDITING_TEXT: 'SET_EDITING_TEXT',

  // 加载状态
  SET_LOADING_EXPLANATION: 'SET_LOADING_EXPLANATION',
  SET_REANALYZING: 'SET_REANALYZING',
  SET_SHOW_REANALYSIS_DIALOG: 'SET_SHOW_REANALYSIS_DIALOG',

  // UI 状态
  SET_SHOW_LEFT_SIDEBAR: 'SET_SHOW_LEFT_SIDEBAR',
  SET_SIDEBAR_WIDTH: 'SET_SIDEBAR_WIDTH',

  // 错误
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // 批量操作
  RESET_ALL: 'RESET_ALL',
}

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    // 文档操作
    case ACTIONS.SET_DOCUMENT_DATA:
      return { ...state, documentData: action.payload }
    case ACTIONS.SET_DOCUMENTS:
      return { ...state, documents: action.payload }
    case ACTIONS.SET_ACTIVE_DOC_ID:
      return { ...state, activeDocId: action.payload }
    case ACTIONS.ADD_DOCUMENT: {
      const updatedDocs = [action.payload, ...state.documents]
      return {
        ...state,
        documents: updatedDocs,
        documentData: action.payload,
        activeDocId: action.payload.id,
      }
    }
    case ACTIONS.UPDATE_DOCUMENT: {
      const updatedDocs = state.documents.map(doc =>
        doc.id === action.payload.id ? action.payload : doc
      )
      return {
        ...state,
        documents: updatedDocs,
        documentData: state.activeDocId === action.payload.id ? action.payload : state.documentData,
      }
    }
    case ACTIONS.DELETE_DOCUMENT: {
      const updatedDocs = state.documents.filter(doc => doc.id !== action.payload)
      return {
        ...state,
        documents: updatedDocs,
        documentData: state.activeDocId === action.payload ? null : state.documentData,
        activeDocId: state.activeDocId === action.payload ? null : state.activeDocId,
      }
    }

    // 选择和解释
    case ACTIONS.SET_SELECTED_KEYWORD:
      return { ...state, selectedKeyword: action.payload }
    case ACTIONS.SET_EXPLANATION:
      return { ...state, explanation: action.payload }

    // 编辑模式
    case ACTIONS.SET_EDITING:
      return { ...state, isEditing: action.payload }
    case ACTIONS.SET_EDITING_TITLE:
      return { ...state, editingTitle: action.payload }
    case ACTIONS.SET_EDITING_TEXT:
      return { ...state, editingText: action.payload }

    // 加载状态
    case ACTIONS.SET_LOADING_EXPLANATION:
      return { ...state, loadingExplanation: action.payload }
    case ACTIONS.SET_REANALYZING:
      return { ...state, isReanalyzing: action.payload }
    case ACTIONS.SET_SHOW_REANALYSIS_DIALOG:
      return { ...state, showReanalysisDialog: action.payload }

    // UI 状态
    case ACTIONS.SET_SHOW_LEFT_SIDEBAR:
      return { ...state, showLeftSidebar: action.payload }
    case ACTIONS.SET_SIDEBAR_WIDTH:
      return { ...state, sidebarWidth: action.payload }

    // 错误
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload }
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }

    // 重置
    case ACTIONS.RESET_ALL:
      return { ...initialState }

    default:
      return state
  }
}

/**
 * AppProvider 组件
 * 提供全局状态和操作方法
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 从 localStorage 恢复状态
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('documentHistory')
      const savedActiveDocId = localStorage.getItem('activeDocId')

      if (savedHistory) {
        const documents = JSON.parse(savedHistory)
        dispatch({ type: ACTIONS.SET_DOCUMENTS, payload: documents })

        // 如果有活跃文档ID，加载它
        if (savedActiveDocId && documents.some(doc => doc.id === savedActiveDocId)) {
          const activeDoc = documents.find(doc => doc.id === savedActiveDocId)
          dispatch({ type: ACTIONS.SET_DOCUMENT_DATA, payload: activeDoc })
          dispatch({ type: ACTIONS.SET_ACTIVE_DOC_ID, payload: savedActiveDocId })
        }
      }
    } catch (error) {
      console.error('Failed to restore state from localStorage:', error)
    }
  }, [])

  // 保存到 localStorage 的 useEffect
  useEffect(() => {
    try {
      localStorage.setItem('documentHistory', JSON.stringify(state.documents))
      if (state.activeDocId) {
        localStorage.setItem('activeDocId', state.activeDocId)
      } else {
        localStorage.removeItem('activeDocId')
      }
    } catch (error) {
      console.error('Failed to save state to localStorage:', error)
    }
  }, [state.documents, state.activeDocId])

  // 便捷操作方法
  const actions = {
    setDocumentData: useCallback(
      (data) => dispatch({ type: ACTIONS.SET_DOCUMENT_DATA, payload: data }),
      []
    ),
    setDocuments: useCallback(
      (docs) => dispatch({ type: ACTIONS.SET_DOCUMENTS, payload: docs }),
      []
    ),
    setActiveDocId: useCallback(
      (id) => dispatch({ type: ACTIONS.SET_ACTIVE_DOC_ID, payload: id }),
      []
    ),
    addDocument: useCallback(
      (doc) => dispatch({ type: ACTIONS.ADD_DOCUMENT, payload: doc }),
      []
    ),
    updateDocument: useCallback(
      (doc) => dispatch({ type: ACTIONS.UPDATE_DOCUMENT, payload: doc }),
      []
    ),
    deleteDocument: useCallback(
      (id) => dispatch({ type: ACTIONS.DELETE_DOCUMENT, payload: id }),
      []
    ),
    setSelectedKeyword: useCallback(
      (keyword) => dispatch({ type: ACTIONS.SET_SELECTED_KEYWORD, payload: keyword }),
      []
    ),
    setExplanation: useCallback(
      (explanation) => dispatch({ type: ACTIONS.SET_EXPLANATION, payload: explanation }),
      []
    ),
    setEditing: useCallback(
      (isEditing) => dispatch({ type: ACTIONS.SET_EDITING, payload: isEditing }),
      []
    ),
    setEditingTitle: useCallback(
      (title) => dispatch({ type: ACTIONS.SET_EDITING_TITLE, payload: title }),
      []
    ),
    setEditingText: useCallback(
      (text) => dispatch({ type: ACTIONS.SET_EDITING_TEXT, payload: text }),
      []
    ),
    setLoadingExplanation: useCallback(
      (loading) => dispatch({ type: ACTIONS.SET_LOADING_EXPLANATION, payload: loading }),
      []
    ),
    setReanalyzing: useCallback(
      (reanalyzing) => dispatch({ type: ACTIONS.SET_REANALYZING, payload: reanalyzing }),
      []
    ),
    setShowReanalysisDialog: useCallback(
      (show) => dispatch({ type: ACTIONS.SET_SHOW_REANALYSIS_DIALOG, payload: show }),
      []
    ),
    setShowLeftSidebar: useCallback(
      (show) => dispatch({ type: ACTIONS.SET_SHOW_LEFT_SIDEBAR, payload: show }),
      []
    ),
    setSidebarWidth: useCallback(
      (width) => dispatch({ type: ACTIONS.SET_SIDEBAR_WIDTH, payload: width }),
      []
    ),
    setError: useCallback(
      (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
      []
    ),
    clearError: useCallback(
      () => dispatch({ type: ACTIONS.CLEAR_ERROR }),
      []
    ),
    resetAll: useCallback(
      () => dispatch({ type: ACTIONS.RESET_ALL }),
      []
    ),
  }

  const value = {
    state,
    dispatch,
    ...actions,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

/**
 * 自定义 Hook: useApp
 * 在组件中使用全局状态
 */
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
