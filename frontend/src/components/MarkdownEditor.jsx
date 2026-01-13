import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseToMarkdown } from '../services/api'

const MarkdownEditor = ({ title, text, onSave, onCancel }) => {
  const [mode, setMode] = useState('edit') // 'edit' or 'preview' or 'split'
  const [editTitle, setEditTitle] = useState(title)
  const [editText, setEditText] = useState(text)
  const [isConverting, setIsConverting] = useState(false)
  const [convertError, setConvertError] = useState(null)

  const handleSave = () => {
    onSave(editTitle, editText)
  }

  const handleConvertToMarkdown = async () => {
    if (!editText.trim()) {
      setConvertError('请输入内容')
      return
    }

    setIsConverting(true)
    setConvertError(null)

    try {
      const result = await parseToMarkdown(editText, editTitle)
      setEditText(result.markdown)
      setConvertError(null)
    } catch (error) {
      setConvertError('转换失败，请重试')
      console.error('Error converting to markdown:', error)
    } finally {
      setIsConverting(false)
    }
  }

  const insertMarkdown = (before, after = '') => {
    const textarea = document.getElementById('markdown-textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editText.substring(start, end)
    const newText =
      editText.substring(0, start) +
      before +
      selectedText +
      after +
      editText.substring(end)

    setEditText(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selectedText.length
    }, 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">编辑文档</h2>
            <p className="text-sm text-gray-600 mt-1">支持 Markdown 格式</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              取消
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium">
              保存
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-0 px-6 pt-4 border-b bg-gray-50">
          {['edit', 'split', 'preview'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
              }`}
            >
              {m === 'edit' ? '📝 编辑' : m === 'split' ? '📋 分屏' : '👁️ 预览'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex gap-4 p-6">
          {/* Title Input */}
          <div className="absolute top-20 left-6 right-6 w-auto">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="文档标题"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>

          {/* Markdown Toolbar */}
          {mode !== 'preview' && (
            <div className="absolute top-[120px] left-6 right-6 w-auto">
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => insertMarkdown('# ')}
                  className="px-2 py-1 text-sm font-bold bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="标题"
                >
                  H1
                </button>
                <button
                  onClick={() => insertMarkdown('## ')}
                  className="px-2 py-1 text-sm font-bold bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="副标题"
                >
                  H2
                </button>
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  className="px-2 py-1 text-sm font-bold bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="粗体"
                >
                  B
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  className="px-2 py-1 text-sm italic bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="斜体"
                >
                  I
                </button>
                <button
                  onClick={() => insertMarkdown('`', '`')}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-mono"
                  title="代码"
                >
                  Code
                </button>
                <button
                  onClick={() => insertMarkdown('- ')}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="列表"
                >
                  • List
                </button>
                <button
                  onClick={() => insertMarkdown('[', '](url)')}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="链接"
                >
                  Link
                </button>
                <button
                  onClick={() => insertMarkdown('> ')}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="引用"
                >
                  Quote
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleConvertToMarkdown}
                  disabled={isConverting}
                  className="px-3 py-1 text-sm bg-green-600 text-white border border-green-700 rounded hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  title="使用AI智能转换为Markdown"
                >
                  {isConverting ? '🔄 转换中...' : '✨ AI转换'}
                </button>
              </div>
              {convertError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {convertError}
                </div>
              )}
            </div>
          )}

          {/* Edit Mode */}
          {mode === 'edit' && (
            <textarea
              id="markdown-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="在此输入内容，支持 Markdown..."
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono text-sm resize-none"
              style={{ marginTop: '80px' }}
            />
          )}

          {/* Split Mode */}
          {mode === 'split' && (
            <>
              <textarea
                id="markdown-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="在此输入内容，支持 Markdown..."
                className="flex-1 p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono text-sm resize-none"
                style={{ marginTop: '80px' }}
              />
              <div
                className="flex-1 p-4 border border-gray-300 rounded-lg overflow-y-auto bg-gray-50 markdown-content"
                style={{ marginTop: '80px' }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{editText}</ReactMarkdown>
              </div>
            </>
          )}

          {/* Preview Mode */}
          {mode === 'preview' && (
            <div
              className="flex-1 p-4 border border-gray-300 rounded-lg overflow-y-auto bg-white markdown-content"
              style={{ marginTop: '80px' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{editText}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
