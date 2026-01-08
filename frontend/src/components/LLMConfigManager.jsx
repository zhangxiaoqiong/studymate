import React, { useState, useEffect } from 'react'

const LLMConfigManager = ({ onClose, isInMenu = false }) => {
  // 表单状态
  const [apiBase, setApiBase] = useState('https://api.deepseek.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('deepseek-chat')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [configName, setConfigName] = useState('')

  // UI 状态
  const [configs, setConfigs] = useState([])
  const [activeConfigId, setActiveConfigId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [error, setError] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [saved, setSaved] = useState(false)

  // 预设
  const presets = [
    {
      name: 'DeepSeek',
      apiBase: 'https://api.deepseek.com/v1',
      modelName: 'deepseek-chat',
    },
    {
      name: 'OpenAI',
      apiBase: 'https://api.openai.com/v1',
      modelName: 'gpt-4',
    },
    {
      name: '智谱 GLM',
      apiBase: 'https://open.bigmodel.cn/api/paas/v4',
      modelName: 'glm-4',
    },
    {
      name: '阿里通义千问',
      apiBase: 'https://dashscope.aliyuncs.com/api/v1',
      modelName: 'qwen-max',
    },
  ]

  // 加载配置列表
  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/user_config')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])

        // 查找活跃配置
        const active = data.configs?.find(c => c.is_active)
        if (active) {
          setActiveConfigId(active.id)
        }
      }
    } catch (err) {
      console.error('加载配置失败:', err)
    }
  }

  const generateConfigName = () => {
    try {
      const host = new URL(apiBase).hostname
      return `${modelName} @ ${host}`
    } catch {
      return `${modelName} @ ${apiBase}`
    }
  }

  const resetForm = () => {
    setApiBase('https://api.deepseek.com/v1')
    setApiKey('')
    setModelName('deepseek-chat')
    setTemperature(0.7)
    setMaxTokens(1000)
    setConfigName('')
    setError(null)
    setTestResult(null)
  }

  const handleNewConfig = () => {
    resetForm()
    setIsEditing(true)
    setEditingId(null)
  }

  const handleEdit = async (config) => {
    try {
      const response = await fetch(`/api/llm_config/${encodeURIComponent(config.config_name)}`)
      if (!response.ok) {
        throw new Error('获取配置失败')
      }
      const fullConfig = await response.json()

      setApiBase(fullConfig.apiBase)
      setApiKey(fullConfig.apiKey)
      setModelName(fullConfig.modelName)
      setTemperature(fullConfig.temperature || 0.7)
      setMaxTokens(fullConfig.maxTokens || 1000)
      setConfigName(config.config_name)
      setIsEditing(true)
      setEditingId(config.id)
      setError(null)
      setTestResult(null)
    } catch (err) {
      alert('获取配置失败: ' + err.message)
    }
  }

  const handleSave = async () => {
    if (!modelName.trim()) {
      setError('模型名称不能为空')
      return
    }
    if (!apiKey.trim() && !isEditing) {
      setError('API Key 不能为空')
      return
    }

    const generatedName = generateConfigName()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/llm_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configName: generatedName,
          apiBase,
          apiKey,
          modelName,
          temperature,
          maxTokens,
          editingConfigName: editingId ? configName : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '保存失败')
      }

      await loadConfigs()
      setIsEditing(false)
      resetForm()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (config) => {
    if (!window.confirm(`确定要删除配置 "${config.config_name}" 吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/llm_config/${encodeURIComponent(config.config_name)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      await loadConfigs()
      if (editingId === config.id) {
        setIsEditing(false)
        resetForm()
      }
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleSwitch = async (config) => {
    if (activeConfigId === config.id) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/activate_config/${encodeURIComponent(config.config_name)}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('切换失败')
      }

      await loadConfigs()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('切换失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'API Key 不能为空' })
      return
    }

    setTestLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test_llm_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiBase,
          apiKey,
          modelName,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTestResult(data)
    } catch (err) {
      setTestResult({
        success: false,
        message: '测试失败: ' + err.message,
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    resetForm()
  }

  if (isEditing) {
    return (
      <div className="p-6 space-y-6 overflow-y-auto h-full bg-white">
        {/* 标题 */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {editingId ? '✏️ 编辑配置' : '➕ 新建配置'}
          </h3>
        </div>

        {/* 预设快速选择 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">快速预设</label>
          <select
            value=""
            onChange={(e) => {
              const preset = presets.find(p => p.name === e.target.value)
              if (preset) {
                setApiBase(preset.apiBase)
                setModelName(preset.modelName)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          >
            <option value="">选择预设...</option>
            {presets.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} - {p.modelName}
              </option>
            ))}
          </select>
        </div>

        {/* 表单 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API 基础 URL</label>
            <input
              type="text"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxx..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">🔒 加密存储</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="deepseek-chat"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Temperature</label>
              <span className="text-xs font-semibold text-blue-600">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大 Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              min="100"
              max="4000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
            />
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        {/* 测试结果 */}
        {testResult && (
          <div className={`rounded-lg p-3 border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </p>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleTestConnection}
            disabled={testLoading || loading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {testLoading ? '测试中...' : '🧪 测试连接'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 rounded-lg font-medium text-sm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || testLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? '保存中...' : saved ? '✓ 已保存' : '💾 保存'}
          </button>
        </div>
      </div>
    )
  }

  // 配置列表视图
  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full bg-white">
      {/* 标题和新增按钮 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">📋 大模型配置管理</h3>
        <button
          onClick={handleNewConfig}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
        >
          ➕ 新建配置
        </button>
      </div>

      {/* 成功提示 */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">✅ 操作成功</p>
        </div>
      )}

      {/* 配置列表 */}
      {configs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">暂无配置</p>
          <button
            onClick={handleNewConfig}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
          >
            创建第一个配置
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeConfigId === config.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {config.config_name}
                    {activeConfigId === config.id && (
                      <span className="ml-2 text-green-600 font-bold text-sm">✓ 活跃</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {config.model_name} • Temp: {config.temperature} • Max: {config.max_tokens}
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {activeConfigId !== config.id && (
                    <button
                      onClick={() => handleSwitch(config)}
                      disabled={loading}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded font-medium transition-colors"
                    >
                      切换
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(config)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs rounded font-medium transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(config)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs rounded font-medium transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 信息提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
        <p className="text-xs text-blue-700">
          <strong>💡 提示：</strong> 点击"测试连接"按钮可验证 API 配置是否可用
        </p>
      </div>
    </div>
  )
}

export default LLMConfigManager
