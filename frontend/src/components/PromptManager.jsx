import React, { useState, useEffect } from 'react'

const PromptManager = ({ isOpen, onClose }) => {
  const [prompts, setPrompts] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    content: '',
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const categories = [
    { value: 'general', label: '通用' },
    { value: 'academic', label: '学术' },
    { value: 'business', label: '商业' },
    { value: 'technical', label: '技术' },
    { value: 'creative', label: '创意' },
  ]

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = () => {
    try {
      const saved = localStorage.getItem('customPrompts')
      if (saved) {
        setPrompts(JSON.parse(saved))
      }
    } catch (err) {
      console.error('Failed to load prompts:', err)
    }
  }

  const savePrompts = (updatedPrompts) => {
    try {
      localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts))
      setPrompts(updatedPrompts)
    } catch (err) {
      console.error('Failed to save prompts:', err)
      setError('保存失败')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.content.trim()) {
      setError('名称和内容不能为空')
      return
    }

    let updated
    if (editingId) {
      // 编辑
      updated = prompts.map(p =>
        p.id === editingId
          ? { ...p, ...formData, updatedAt: new Date().toISOString() }
          : p
      )
    } else {
      // 新建
      const newPrompt = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      updated = [newPrompt, ...prompts]
    }

    savePrompts(updated)
    resetForm()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const handleEdit = (prompt) => {
    setFormData({
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      content: prompt.content,
    })
    setEditingId(prompt.id)
    setIsEditing(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除此Prompt吗？')) {
      const updated = prompts.filter(p => p.id !== id)
      savePrompts(updated)
    }
  }

  const handleDuplicate = (prompt) => {
    const newPrompt = {
      id: Date.now().toString(),
      ...prompt,
      name: `${prompt.name}（副本）`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    savePrompts([newPrompt, ...prompts])
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      content: '',
    })
    setEditingId(null)
    setIsEditing(false)
    setError(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📋 Prompt 模板管理</h2>
            <p className="text-blue-100 text-sm mt-1">创建和管理自定义 Prompt 模板</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Area */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingId ? '✎ 编辑 Prompt' : '➕ 新建 Prompt'}
                </h3>

                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-600">
                    ✓ 操作成功
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt 名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如：论文摘要提取"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      描述
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="简短描述这个 Prompt 的用途"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt 内容 *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="输入自定义 Prompt 内容..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm resize-none"
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 提示：使用 {'{keyword}'} 和 {'{context}'} 作为占位符
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                    >
                      {editingId ? '更新' : '创建'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium text-sm transition-colors"
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Prompts List Area */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📚 我的 Prompts ({prompts.length})
              </h3>

              {prompts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无 Prompt，创建第一个吧</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {prompts.map((prompt) => (
                    <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{prompt.name}</div>
                          {prompt.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{prompt.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {categories.find(c => c.value === prompt.category)?.label || prompt.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-2 mb-2 max-h-24 overflow-y-auto">
                        <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                          {prompt.content.substring(0, 150)}
                          {prompt.content.length > 150 ? '...' : ''}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(prompt.content)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          📋 复制
                        </button>
                        <button
                          onClick={() => handleEdit(prompt)}
                          className="flex-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                        >
                          ✎ 编辑
                        </button>
                        <button
                          onClick={() => handleDuplicate(prompt)}
                          className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          ⚡ 复制
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptManager
