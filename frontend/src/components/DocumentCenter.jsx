import React, { useState, useRef } from 'react'
import axios from 'axios'
import { useApp } from '../context/AppContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const DocumentCenter = ({ onEditClick }) => {
  const { state, setSelectedKeyword, addDocument } = useApp()
  const { documentData, spans = [] } = state

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) {
      setUploadError('请输入文本内容')
      return
    }

    setLoading(true)
    setUploadError('')

    try {
      const response = await axios.post('/api/extract_keywords', {
        text,
        title: text.substring(0, 50) || 'Untitled'
      })

      const doc = {
        id: Date.now().toString(),
        title: text.substring(0, 50) || 'Untitled',
        text: text,
        keywords: response.data.keywords,
        spans: response.data.spans,
        createdAt: new Date().toISOString()
      }

      addDocument(doc)
      setText('')
    } catch (error) {
      setUploadError(error.response?.data?.detail || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    setUploadError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/upload_file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        setText(response.data.text)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || '文件上传失败，请重试'
      setUploadError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const renderHighlightedText = () => {
    if (!spans || spans.length === 0) {
      return <span>{documentData.text}</span>
    }

    let lastIndex = 0
    const elements = []
    const sortedSpans = [...spans].sort((a, b) => a.start - b.start)

    sortedSpans.forEach((span, i) => {
      if (lastIndex < span.start) {
        elements.push(
          <span key={`text-${i}`}>
            {documentData.text.substring(lastIndex, span.start)}
          </span>
        )
      }

      elements.push(
        <span
          key={`keyword-${i}`}
          className="highlight"
          onClick={() => setSelectedKeyword(span.keyword)}
        >
          {documentData.text.substring(span.start, span.end)}
        </span>
      )

      lastIndex = span.end
    })

    if (lastIndex < documentData.text.length) {
      elements.push(
        <span key="text-end">
          {documentData.text.substring(lastIndex)}
        </span>
      )
    }

    return elements
  }

  // 文档预览模式
  if (documentData) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {/* Document Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">📖 {documentData.title || 'Untitled'}</h1>
              <div className="flex gap-6 text-sm text-gray-600 mt-2">
                <span>📊 <span className="font-semibold">{documentData.text.length}</span> 字符</span>
                <span>📝 <span className="font-semibold">{documentData.text.split('\n').length}</span> 段落</span>
                <span>🔑 <span className="font-semibold text-blue-600">{spans?.length || 0}</span> 关键词</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEditClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex-shrink-0"
              >
                ✎ 编辑
              </button>
              <button
                onClick={() => {
                  setTitle('')
                  setText('')
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors flex-shrink-0"
              >
                📤 新文档
              </button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="px-8 py-6 max-w-4xl mx-auto">
            <div className="markdown-content text-gray-800 leading-relaxed">
              <div className="prose prose-lg">
                {renderHighlightedText()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-700 flex items-center gap-2">
          <span>💡</span>
          <span>点击 <span className="highlight text-sm">高亮关键词</span> 即可查看详细解释</span>
        </div>
      </div>
    )
  }

  // 上传模式
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 via-white to-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* 欢迎标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">开始学习</h1>
          <p className="text-xl text-gray-600">上传或粘贴文本，AI 将自动提取关键知识点供你深入探索</p>
        </div>

        {/* 上传卡片 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* 拖拽 + 文本输入区域 */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`px-6 py-4 border-2 border-dashed transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 文本输入框 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📄 文本内容</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="粘贴你的文本内容或拖拽文件到这里... （最少输入 20 个字符）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none font-mono text-sm"
                  rows={8}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {text.length} / 3000 字符
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    选择文件
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    accept=".txt,.pdf,.docx,.md"
                    className="hidden"
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  ❌ {uploadError}
                </div>
              )}

              {/* 按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || text.trim().length < 20}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? '⏳ 处理中...' : '🚀 开始探索'}
                </button>
              </div>

              {/* 提示信息 */}
              <p className="text-xs text-gray-500 text-center">
                💡 提示：输入更长的文本可以提高关键词提取的准确性
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DocumentCenter
