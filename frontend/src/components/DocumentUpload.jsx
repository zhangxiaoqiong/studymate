import React, { useState, useRef } from 'react'
import axios from 'axios'

const DocumentUpload = ({ onUpload }) => {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) {
      alert('请输入文本内容')
      return
    }

    setLoading(true)
    try {
      await onUpload({ text, title: title || 'Untitled' })
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

      const response = await axios.post('http://localhost:8001/upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setText(response.data.text)
        setTitle(response.data.title)
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
    if (file) {
      handleFileUpload(file)
    }
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

    const file = e.dataTransfer?.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const exampleText = `深度学习是机器学习的一个重要分支。它使用多层神经网络来学习数据的表示。卷积神经网络特别适合处理图像数据。循环神经网络则用于序列处理。Transformer 架构通过自注意力机制实现了重大突破。`

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📖 文档探索器
          </h1>
          <p className="text-gray-600 text-lg">
            上传或粘贴文本，AI 将自动提取关键知识点供你深入探索
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文件上传区域 */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx,.doc,.md"
              onChange={handleFileInputChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z" />
              </svg>
              <p className="text-gray-700 font-medium mb-1">📤 上传文件或拖拽到这里</p>
              <p className="text-gray-500 text-sm">支持 .txt, .pdf, .docx, .md (最大 5MB)</p>
            </div>
          </div>

          {/* 错误提示 */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              ❌ {uploadError}
            </div>
          )}

          {/* 文档标题输入 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 文档标题 (可选)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：深度学习基础"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {/* 文本内容输入 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📄 文本内容
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="粘贴你的文本内容... （最少输入 20 个字符）"
              rows={12}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-gray-500 mt-2">
              {text.length} / 3000 字符
            </p>
          </div>

          {/* 快速示例按钮 */}
          <div>
            <button
              type="button"
              onClick={() => setText(exampleText)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              📌 使用示例文本
            </button>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                处理中...
              </>
            ) : (
              <>
                🚀 开始探索
              </>
            )}
          </button>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            💡 <strong>提示：</strong> 输入更长的文本可以提高关键词提取的准确性
          </div>
        </form>
      </div>
    </div>
  )
}

export default DocumentUpload
