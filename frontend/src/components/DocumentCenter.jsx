import React, { useState, useRef } from 'react'
import axios from 'axios'
import { useApp } from '../context/AppContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createElement as h } from 'react'

const DocumentCenter = ({ onEditClick }) => {
  const { state, setKeywords, addDocument, updateDocument, setDocumentData, setActiveDocId } = useApp()
  const { documentData } = state

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showMarkdownConverter, setShowMarkdownConverter] = useState(false)
  const [convertingMarkdown, setConvertingMarkdown] = useState(false)
  const fileInputRef = useRef(null)

  // 自定义代码块渲染
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''

    if (inline) {
      return <code className="bg-gray-200 px-2 py-1 rounded text-sm text-gray-900 font-mono" {...props}>{children}</code>
    }

    // 获取代码内容
    const code = String(children).replace(/\n$/, '')

    // 代码块渲染
    return (
      <div className="rounded-lg my-4 overflow-hidden border border-gray-700">
        {language && (
          <div className="bg-gray-800 text-gray-400 px-4 py-2 text-xs font-mono font-semibold">
            {language}
          </div>
        )}
        <pre className="bg-gray-900 text-green-400 p-4 overflow-x-auto">
          <code className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">{code}</code>
        </pre>
      </div>
    )
  }

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
        spans: [],
        timestamp: Date.now()
      }

      // 保存关键词到全局状态
      setKeywords(response.data.keywords)

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

  const renderDocumentContent = () => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ code: CodeBlock }}
      >
        {documentData.text}
      </ReactMarkdown>
    )
  }

  const handleConvertToMarkdown = async () => {
    if (!documentData) return

    setConvertingMarkdown(true)
    try {
      const response = await axios.post('/api/parse_to_markdown', {
        text: documentData.text,
        title: documentData.title
      })

      // 更新文档内容为 Markdown 格式
      const updatedDoc = {
        ...documentData,
        text: response.data.markdown
      }

      // 更新全局状态
      updateDocument(updatedDoc)
      setShowMarkdownConverter(false)

      // 显示成功提示
      alert('✅ 已转换为Markdown格式！')
    } catch (error) {
      alert('❌ 转换失败：' + (error.response?.data?.detail || error.message))
    } finally {
      setConvertingMarkdown(false)
    }
  }

  // 文档预览模式 - 只有当文档有实际内容（text不为空）时才显示预览
  if (documentData && documentData.text.trim()) {
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
                <span>🔑 <span className="font-semibold text-blue-600">{documentData.keywords?.length || 0}</span> 关键词</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMarkdownConverter(!showMarkdownConverter)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex-shrink-0"
              >
                ✨ 转为Markdown
              </button>
              <button
                onClick={onEditClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex-shrink-0"
              >
                ✎ 编辑
              </button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="px-8 py-6 max-w-4xl mx-auto">
            <div className="markdown-content text-gray-800 leading-relaxed">
              <div className="prose prose-lg">
                {renderDocumentContent()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-700 flex items-center gap-2">
          <span>💡</span>
          <span>在右侧关键词列表中点击关键词即可查看详细解释</span>
        </div>

        {/* Markdown Conversion Modal */}
        {showMarkdownConverter && documentData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">✨ 转换为Markdown</h3>
                <p className="text-gray-600 mb-4">
                  将文本内容自动格式化为结构化的Markdown格式。AI将识别标题、列表等结构并应用格式化。
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  转换后的内容将替换当前文档。转换通常需要几秒钟。
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMarkdownConverter(false)}
                    disabled={convertingMarkdown}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConvertToMarkdown}
                    disabled={convertingMarkdown}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400"
                  >
                    {convertingMarkdown ? '⏳ 转换中...' : '✨ 确认转换'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 上传模式
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
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
